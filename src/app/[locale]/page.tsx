"use client";

import dayjs from 'dayjs'
import { toast } from "sonner";
import { useAtom } from "jotai";
import { VscSync } from "react-icons/vsc";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { BsRocketFill } from "react-icons/bs";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { onVerification } from "@/api/verification";
import { ErrorToast } from '@/components/ui/errorToast';
import { appConfigAtom, userConfigAtom } from "@/stores";
import { VerifyResults } from "@/components/VerifyResults";
import { addData, IClaim, IJinaClaim } from "@/api/indexDB";

export default function Home() {
  const t = useTranslations('home');

  const [{ hideBrand, apiKey, modelName: modelId }] = useAtom(appConfigAtom);
  const [{ verifyParams, content, verifyResult: { exaFinalResults, jinaFinalResults } }, useUserConfig] = useAtom(userConfigAtom);

  const [loading, setLoading] = useState(false)
  const [isTopUp, setIsTopUp] = useState(false)

  const onSaveVerifyParams = (type: string, value: any) => {
    if (type === 'jina' && !value) {
      useUserConfig((v) => ({ ...v, verifyParams: { ...v.verifyParams, [type]: false, depthVerif: false } }))
    } else {
      useUserConfig((v) => ({ ...v, verifyParams: { ...v.verifyParams, [type]: value } }))
    }
  }

  const onStateVerify = async () => {
    if (content.trim().length < 50) {
      toast.warning(t('contentError'))
      return;
    }
    const exaTempList: IClaim[] = [];
    const jinaTempList: IJinaClaim[] = [];
    try {
      setLoading(true);
      await onVerification({
        content,
        verifyParams,
        apiKey: apiKey || '',
        modelId: modelId || '',
      },
        (data: { exaFinalResults?: IClaim, jinaFinalResults?: IJinaClaim }) => {
          if (data?.exaFinalResults) {
            exaTempList.push(data.exaFinalResults)
          }
          if (data?.jinaFinalResults) {
            jinaTempList.push(data.jinaFinalResults)
          }
          useUserConfig((v) => ({ ...v, verifyResult: { ...v, verifyContent: content, exaFinalResults: exaTempList, jinaFinalResults: jinaTempList } }));
          setTimeout(() => {
            window.scrollTo({
              top: document.documentElement.scrollHeight,
              behavior: 'smooth'
            });
          }, 200)
        },
        async (error) => {
          if (!error) {
            if (exaTempList.length || jinaTempList.length) {
              await addData({
                content,
                exaFinalResults: exaTempList,
                jinaFinalResults: jinaTempList,
                date: dayjs().format('YYYY-MM-DD HH:mm:ss')
              })
            }
            toast.error(t('verificationCompleted'));
          } else {
            if (error.error?.err_code) {
              toast.error(() => ErrorToast(error.error?.err_code));
            } else {
              toast.error(t('verificationFailed'));
            }
          }
        },
      )
    } catch (error) {
      toast.error(t('verificationFailed'))
    }
    setLoading(false);
  }

  const onUsageExample = () => {
    const text = t('example');
    useUserConfig((v) => ({ ...v, content: text }))
  }

  useEffect(() => {
    function hasScrollbar() {
      const isScrollable = document.documentElement.scrollHeight > document.documentElement.clientHeight;
      const isAtTop = window.pageYOffset === 0;
      setIsTopUp(isScrollable && !isAtTop);

    }
    window.addEventListener('resize', hasScrollbar);
    window.addEventListener('scroll', hasScrollbar);
    hasScrollbar();
    return () => {
      window.removeEventListener('resize', hasScrollbar);
      window.removeEventListener('scroll', hasScrollbar);
    };
  }, []);

  return (
    <div className="text-2xl lg:w-[1024px] lg:px-5 w-full mx-auto min-h-[calc(100vh-52px)] overflow-hidden px-5">
      <div className='h-24 w-full flex items-center justify-center gap-5 py-5'>
        {!hideBrand && <img src="/images/global/logo-mini.png" className='h-full' />}
        <h2 className='text-[28px] font-bold'>{t('title')}</h2>
      </div>
      <div className="flex gap-5 flex-col items-center justify-center">
        <div className='relative w-full border rounded-sm  pb-7 pt-3 px-3 bg-background'>
          <Textarea
            value={content}
            className="min-h-[50vh] border-none p-0"
            onChange={(e) => useUserConfig((v) => ({ ...v, content: e.target.value }))}
            placeholder={t('textareaPlaceholder')}
            maxLength={5000}
          />
          <div className='absolute left-3 bottom-1 text-sm text-[#7c3aed] cursor-pointer' onClick={onUsageExample}>{t('case')}</div>
          <div className='absolute right-3 bottom-1 text-sm text-[#7c3aed]'>{content.length} / 5000</div>
        </div>

        <div className="flex items-center justify-around w-full flex-wrap">
          <div className="flex items-center space-x-2">
            <Switch id="Exa" onCheckedChange={(value) => onSaveVerifyParams('exa', value)} checked={verifyParams.exa} />
            <Label className='cursor-pointer' htmlFor="Exa">Exa</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="Jina" onCheckedChange={(value) => onSaveVerifyParams('jina', value)} checked={verifyParams.jina} />
            <Label className='cursor-pointer' htmlFor="Jina">Jina</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="depthVerif" disabled={!verifyParams.jina} onCheckedChange={(value) => onSaveVerifyParams('depthVerif', value)} checked={verifyParams.depthVerif} />
            <Label className='cursor-pointer' htmlFor="depthVerif">{t('deepVerification')}</Label>
          </div>
        </div>

        <div className="mb-5">
          <Button className="w-[200px]" size="lg" disabled={!content?.trim().length || loading || (!verifyParams.exa && !verifyParams.jina)} onClick={onStateVerify}>
            {!loading ? t('verification') : t('verificationLoading')}
            {loading && <VscSync className='animate-spin !size-5' />}
          </Button>
        </div>

        {(exaFinalResults.length || jinaFinalResults.length) ? <VerifyResults loading={loading} /> : <></>}
        {
          (loading && isTopUp) &&
          <div className='flex items-center gap-2 text-base text-[#7c3aed]'>
            {t('verificationLoading')}<VscSync className='animate-spin !size-5' />
          </div>
        }
      </div>
      {
        isTopUp &&
        <div
          className={`fixed bottom-40 right-[5vw] border-2 rounded-full border-[#7c3aed] p-3 cursor-pointer transition-all opacity-50 hover:!opacity-100`}
          style={{ boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)' }}
          onClick={() => {
            window.scrollTo({
              top: 0,
              behavior: 'smooth',
            })
          }}>
          <BsRocketFill className='text-[#7c3aed]' />
        </div>
      }
    </div >
  );
}
