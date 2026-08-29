import ReactMarkdown from 'react-markdown'

type Props = {
  children: string
  className?: string
}

/** Markdown文字列をHTMLとしてレンダリングする */
export function MarkdownContent({ children, className }: Props) {
  return (
    <div className={className}>
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  )
}
