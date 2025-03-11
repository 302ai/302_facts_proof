import { toast } from "sonner";
import { useAtom } from "jotai";
import { Button } from "../ui/button";
import { MdClose } from "react-icons/md";
import { userConfigAtom } from "@/stores";
import { useTranslations } from "next-intl";
import { IoCopyOutline } from "react-icons/io5";
import { IClaim, IJinaClaim } from "@/api/indexDB";
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

export const VerifyResults = (props: { loading: boolean }) => {
  const t = useTranslations('verifyResults');

  const [{ verifyResult: { verifyContent, exaFinalResults, jinaFinalResults } }, useUserConfig] = useAtom(userConfigAtom);

  const floatingWindowRef = useRef<HTMLDivElement>(null);
  const claimRefs = useRef<{ [key: string]: React.RefObject<HTMLDivElement> }>({});

  const [open, setOpen] = useState(false)
  const [content, setContent] = useState(verifyContent)
  const [selectedClaim, setSelectedClaim] = useState<{ original_text: string, assessment: boolean } | null>(null);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);

  const scrollToClaim = useCallback((type: 'Exa' | 'Jina', claim: string, assessment: boolean) => {
    const key = `${type}-${claim}`;
    const ref = claimRefs.current[key];
    Object.keys(claimRefs.current).forEach((key) => {
      const ref = claimRefs.current[key];
      if (ref && ref.current) {
        ref.current.style.borderColor = '#e5e7eb';
      }
    })
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      ref.current.style.borderColor = assessment ? '#16a34a' : '#dc2626';
      ref.current.style.backgroundColor = assessment ? '#16a34a03' : '#ff000003'
    }
  }, []);

  const highlightClaims = () => {
    const segments = [];
    let lastIndex = 0;

    const exaFilteredClaims = exaFinalResults?.filter(
      (claim) => claim.assessment.toLowerCase() !== 'insufficient information'
    ).map(item => ({ original_text: item.original_text, assessment: item.assessment.toLowerCase().includes('true') }));

    const jinaFilteredClaims = jinaFinalResults?.map(item => ({ original_text: item.original_text, assessment: item.result }))

    const sortedClaims = [...exaFilteredClaims, ...jinaFilteredClaims].sort((a, b) => {
      return content.indexOf(a.original_text) - content.indexOf(b.original_text);
    });

    sortedClaims.forEach((claim) => {
      const index = content.indexOf(claim.original_text, lastIndex);
      if (index !== -1) {
        const previousText = content.substring(lastIndex, index);
        segments.push(
          previousText.split('\n').map((line, i) => (
            <React.Fragment key={`text-${lastIndex}-${i}`}>
              {i > 0 && <br />}
              {line}
            </React.Fragment>
          ))
        );

        let isConflicting = false;
        if (exaFinalResults.length && jinaFinalResults.length) {
          isConflicting = exaFinalResults.some(exaClaim => (exaClaim.original_text === claim.original_text && exaClaim.assessment.toLowerCase().includes('true') !== claim.assessment)) ||
            jinaFinalResults.some(jinaClaim => (jinaClaim.original_text === claim.original_text && jinaClaim.result !== claim.assessment));
        }

        segments.push(
          <span
            key={`claim-${index}`}
            className={`cursor-pointer border-b-2 
              ${isConflicting ? 'border-yellow-500' : claim.assessment ? 'border-green-500' : 'border-red-500'}
              ${selectedClaim?.original_text === claim.original_text ? isConflicting ? 'bg-yellow-100/50' : claim.assessment ? 'bg-green-100/50' : 'bg-red-100/50' : ''}`}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setClickPosition({ x: rect.left, y: rect.top });
              setSelectedClaim(claim);
              setOpen(true)
            }}
          >
            {claim.original_text}
          </span>
        );
        lastIndex = index + claim.original_text.length;
      }
    });

    const remainingText = content.substring(lastIndex);
    segments.push(
      remainingText.split('\n').map((line, i) => (
        <React.Fragment key={`text-end-${i}`}>
          {i > 0 && <br />}
          {line}
        </React.Fragment>
      ))
    );

    return segments;
  };

  const exaCradList = (list: IClaim[]) => {
    return (
      list?.map(item => {
        const assessment = item.assessment.toLowerCase() === 'true'
        const key = `Exa-${item.claim}`;
        if (!claimRefs.current[key]) {
          claimRefs.current[key] = React.createRef<HTMLDivElement>();
        }
        return (
          <div ref={claimRefs.current[key]} className="border rounded-sm p-3 grid gap-3 text-base bg-background" key={key}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base">{item.claim}</h4>
                <p className="text-xs text-[#7c3aed] mt-1 text-wrap"><span className="font-bold ">{t('original_text')}</span>：{item.original_text}</p>
              </div>
              <span className="text-slate-500 text-xs">Exa</span>
            </div>

            <div className={`flex items-center gap-3 ${assessment ? 'text-green-700' : 'text-red-700'}`}>
              <div className={`w-11 h-11 flex items-center justify-center border-[2px] rounded-full ${assessment ? 'border-green-600' : 'border-red-600'} text-sm`}>
                {item.confidence_score}%
              </div>
              <span>{assessment ? t('believable') : t('refuted')}</span>
            </div>

            <p className="py-2 text-sm text-slate-600">
              <span className="font-bold">{t('desc')}：</span>
              {item.summary}
            </p>

            {
              item.url_sources?.length ?
                <div>
                  <h4 className="font-bold">{t('informationSources')}</h4>
                  <div className="py-2 grid grid-cols-1 justify-items-start text-sm text-blue-500">
                    {
                      item.url_sources?.map((sources, index) => (
                        <TooltipProvider key={`Jina-${sources?.url}-${index}`}>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <Button
                                variant='ghost'
                                onClick={() => window.open(sources?.url)}
                                className={`p-0 w-full text-[#3b82f6]`}>
                                <p className="text-ellipsis text-nowrap overflow-hidden w-full text-left">{sources?.url}</p>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[80vw]" align='start' alignOffset={100}>
                              <p className="text-ellipsis text-wrap w-full text-left">{sources?.title}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))
                    }
                  </div>
                </div> : <></>
            }

            {
              (content.indexOf(item.fixed_original_text) === -1 && content.indexOf(item.original_text) !== -1 && item.original_text !== item.fixed_original_text && !props.loading) ?
                <div>
                  <h4 className="font-bold">{t('suggestedModifications')}</h4>
                  <div className="py-3 grid gap-2 text-base">
                    <p className="text-gray-500 line-through">{item.original_text}</p>
                    <p className="text-green-700">{item.fixed_original_text}</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <Button className="mx-auto" onClick={() => onSubmitSuggestion(item)}>{t('submitSuggestion')}</Button>
                  </div>
                </div> : <></>
            }
          </div>
        )
      })
    )
  }

  const jinaCradList = (list: IJinaClaim[]) => {
    return (
      list?.map(item => {
        const assessment = item.result;
        const key = `Jina-${item.claim}`;
        if (!claimRefs.current[key]) {
          claimRefs.current[key] = React.createRef<HTMLDivElement>();
        }
        return (
          <div ref={claimRefs.current[key]} className="border rounded-sm p-3 grid gap-3 text-base  bg-background" key={key}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base">{item.claim}</h4>
                <p className="text-xs text-[#7c3aed] mt-1 text-wrap"><span className="font-bold ">{t('original_text')}</span>：{item.original_text}</p>
              </div>
              <span className="text-slate-500 text-xs">Jina</span>
            </div>

            <div className={`flex items-center gap-3 ${assessment ? 'text-green-700' : 'text-red-700'}`}>
              <div className={`w-11 h-11 flex items-center justify-center border-[2px] rounded-full ${assessment ? 'border-green-600' : 'border-red-600'} text-sm`}>
                {+item.factuality * 100}%
              </div>
              <span>{assessment ? t('believable') : t('refuted')}</span>
            </div>

            <p className="py-2 text-sm text-slate-600">
              <span className="font-bold">{t('desc')}：</span>
              {item.reason}
            </p>

            {
              item.references.length ?
                <div>
                  <h4 className="font-bold">{t('informationSources')}</h4>
                  <div className="py-2 grid grid-cols-1 justify-items-start text-sm text-left text-blue-500">
                    {
                      item.references?.map((ref, index) => (
                        <TooltipProvider key={`Jina-${ref.url}-${index}`}>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <Button
                                variant='ghost'
                                onClick={() => window.open(ref.url)}
                                className={`p-0 w-full ${ref.isSupportive ? 'text-green-600' : 'text-red-600'}`}>
                                <p className="text-ellipsis text-nowrap overflow-hidden w-full text-left">{ref.url}</p>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[80vw]" align='start' alignOffset={100}>
                              <p className="text-ellipsis text-wrap">{ref.keyQuote}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                      )
                    }
                  </div>
                </div> : <></>
            }
          </div>
        )
      })
    )
  }

  const onCopy = () => {
    try {
      navigator.clipboard.writeText(content);
      toast.success(t('CopyTextOk'))
    } catch (error) {
      toast.success(t('CopyTextError'))
    }
  }

  const onSubmitSuggestion = (item: IClaim) => {
    setContent((v) => v.replace(item.original_text, item.fixed_original_text))
  }

  const onClose = () => {
    setOpen(false);
    setClickPosition(null)
    setSelectedClaim(null)
    Object.keys(claimRefs.current).forEach((key) => {
      const ref = claimRefs.current[key];
      if (ref && ref.current) {
        ref.current.style.borderColor = '#e5e7eb';
        ref.current.style.backgroundColor = ''
      }
    })
  }

  const floatingWindow = useMemo(() => {
    if (selectedClaim && open) {
      const exaFinalData = exaFinalResults.find(f => f.original_text === selectedClaim.original_text)
      const jinaFinalData = jinaFinalResults.find(f => f.original_text === selectedClaim.original_text)
      return (
        <div
          ref={floatingWindowRef}
          className="grid gap-3 text-sm border p-3 pb-5 pr-5 rounded-sm bg-background fixed z-50 md:w-[350px] w-[80%]"
          style={{ boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)' }}>
          <div className='absolute right-1 top-1 cursor-pointer text-lg' onClick={onClose}><MdClose /></div>
          <p className="pt-2"><span className="font-bold">{t('desc')}：</span>{selectedClaim.original_text}</p>
          {
            exaFinalData &&
            <div className="flex items-center gap-3">
              <div><span className="font-bold">Exa</span>&ensp;{exaFinalData.assessment.toLowerCase() === 'true' ? t('reliableInformation') : t('informationIsUnreliable')}</div>
              <div className="text-[#7c3aed] cursor-pointer" onClick={() => scrollToClaim('Exa', exaFinalData.claim, exaFinalData.assessment.toLowerCase() === 'true')}>{t('view')}</div>
            </div>
          }
          {
            jinaFinalData &&
            <div className="flex items-center gap-3">
              <div><span className="font-bold">Jina</span>&ensp;{jinaFinalData.result ? t('reliableInformation') : t('informationIsUnreliable')}</div>
              <div className="text-[#7c3aed] cursor-pointer" onClick={() => scrollToClaim('Jina', jinaFinalData.claim, jinaFinalData.result)}>{t('view')}</div>
            </div>
          }
        </div>
      )
    } else {
      return null;
    }
  }, [selectedClaim, open, t, clickPosition])

  useEffect(() => {
    setContent(verifyContent);
    setOpen(false);
    setSelectedClaim(null)
  }, [verifyContent])

  useEffect(() => {
    if (floatingWindowRef.current && clickPosition) {
      const floatingWindowWidth = floatingWindowRef.current.offsetWidth;
      const floatingWindowHeight = floatingWindowRef.current.offsetHeight;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = clickPosition.y - floatingWindowHeight
      if (top < 0) {
        top = clickPosition.y;
        if (top + floatingWindowHeight > viewportHeight) {
          top = viewportHeight - floatingWindowHeight;
        }
      }

      let left = clickPosition.x;
      if (left + floatingWindowWidth > viewportWidth) {
        left = viewportWidth - floatingWindowWidth;
      }
      if (left < 0) {
        left = 0;
      }

      floatingWindowRef.current.style.top = `${top}px`;
      floatingWindowRef.current.style.left = `${left}px`;
    }
  }, [clickPosition]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (floatingWindowRef.current && !floatingWindowRef.current.contains(e.target as Node)) {
        onClose()
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="grid gap-5 grid-cols-1">
      <div className="border rounded-sm text-lg p-3 bg-background">
        {highlightClaims()}
        <div className={`flex  items-center flex-wrap mt-3 ${content !== verifyContent ? 'justify-between' : 'justify-end'}`}>
          {content !== verifyContent &&
            <Button size='sm'
              onClick={() => useUserConfig(v => ({ ...v, content: content, verifyResult: { verifyContent: '', exaFinalResults: [], jinaFinalResults: [] } }))}
            >
              {t('reVerify')}
            </Button>
          }
          <Button size='sm' variant='icon' onClick={onCopy}><IoCopyOutline className="text-[#7c3aed]" /></Button>
        </div>
      </div>
      {exaCradList(exaFinalResults)}
      {jinaCradList(jinaFinalResults)}
      {floatingWindow}
    </div>
  )
}
