export type TocHeading = {
  level: 2 | 3
  text: string
  id: string
}

export function parseHeadings(html: string): {
  headings: TocHeading[]
  contentHtml: string
} {
  const headings: TocHeading[] = []
  let index = 0

  const contentHtml = html.replace(
    /<(h[23])(.*?)>([\s\S]*?)<\/\1>/g,
    (_, tag, attrs: string, inner: string) => {
      const level = parseInt(tag[1]) as 2 | 3
      const text = inner.replace(/<[^>]+>/g, '').trim()

      const existingId = attrs.match(/id="([^"]+)"/)
      const capturedId = existingId?.[1]
      if (capturedId) {
        headings.push({ level, text, id: capturedId })
        return `<${tag}${attrs}>${inner}</${tag}>`
      }

      const id = `heading-${index++}`
      headings.push({ level, text, id })
      return `<${tag}${attrs} id="${id}">${inner}</${tag}>`
    }
  )

  return { headings, contentHtml }
}
