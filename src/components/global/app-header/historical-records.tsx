import { toast } from "sonner"
import { useAtom } from "jotai"
import { userConfigAtom } from "@/stores"
import { GoHistory } from "react-icons/go"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { MdDeleteForever } from "react-icons/md"
import { getLsit, deleteData, IFactVerification } from "@/api/indexDB"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function HistoricalRecords() {
  const t = useTranslations('records');

  const [_, useUserConfig] = useAtom(userConfigAtom);

  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<IFactVerification[]>([]);


  useEffect(() => {
    if (open) {
      getLsit().then(res => setRecords(res))
    }
  }, [open])

  const onDelete = (item: IFactVerification) => {
    if (item.id) {
      deleteData(item.id).then(res => {
        setRecords(res)
      }).catch(() => {
        toast.error(t('deleteDataError'))
      })
    }
  }

  const onClickSelectClaim = (item: IFactVerification) => {
    const { exaFinalResults, jinaFinalResults, content: verifyContent } = item;

    const verifyResult = {
      verifyContent,
      exaFinalResults,
      jinaFinalResults,
    }
    useUserConfig((v) => ({ ...v, verifyResult }))
  }

  const exaFinalList = (item: IFactVerification) => {
    const { exaFinalResults, jinaFinalResults } = item;
    if (exaFinalResults.length) {
      return exaFinalResults.map(({ claim, assessment }) => {
        const bg = assessment.toLowerCase() === 'true' ? 'bg-green-500' : 'bg-red-500';
        return (
          <div className="flex items-center gap-3" key={claim}>
            <div className="flex items-center gap-2">
              <div className={`rounded-sm text-white text-xs px-2 py-1 ${bg}`}>Exa</div>
              {
                jinaFinalResults?.some(s => s.reason === claim) &&
                <div className={`rounded-sm text-white text-xs px-2 py-1 ${bg}`}>Jina</div>
              }
            </div>
            <div className="text-ellipsis overflow-hidden text-nowrap">{claim}</div>
          </div>
        )
      })
    }
  }

  const jianFinalList = (item: IFactVerification) => {
    const { exaFinalResults, jinaFinalResults } = item;
    if (jinaFinalResults?.length) {
      const temp = jinaFinalResults?.filter(f => !exaFinalResults.some(s => s.claim === f.reason))
      return temp.map(({ reason, result }) => {
        const bg = result ? 'bg-green-500' : 'bg-red-500';
        return (
          <div className="flex items-center gap-3" key={reason}>
            <div className="flex items-center gap-2">
              <div className={`rounded-sm text-white text-xs px-2 py-1 ${bg}`}>Jina</div>
            </div>
            <div className="text-ellipsis overflow-hidden text-nowrap">{reason}</div>
          </div>
        )
      })
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="icon" size="roundIconSm"><GoHistory /></Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='overflow-y-auto max-h-[70vh] md:w-[400px]'>
        {
          records.length ?
            <div className="grid grid-cols-1 gap-3">
              {
                records.map(item => (
                  <div className="p-3 grid grid-cols-1 gap-3 text-sm border cursor-pointer rounded-sm" key={item?.id} onClick={() => onClickSelectClaim(item)}>
                    <p className="w-full text-ellipsis overflow-hidden text-nowrap">{item.content}</p>
                    <div className="grid grid-cols-1 gap-3">
                      {exaFinalList(item)}
                      {jianFinalList(item)}
                    </div>
                    <div className="flex justify-between items-end gap-3 flex-wrap">
                      <span className="text-slate-500">{item.date}</span>
                      <Button size='roundIconMd' variant='icon' onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(item) }}>
                        <MdDeleteForever className="text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))
              }
            </div> :
            <div className="flex flex-col gap-5 items-center justify-center font-bold text-slate-500">
              <img src="/images/global/empty.png" className="w-[150px]" />
              {t('noRecord')}
            </div>
        }
      </PopoverContent>
    </Popover>
  )
}
