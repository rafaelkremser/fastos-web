// React moves a <title> rendered anywhere into the document head
export function PageTitle({ title }: { title: string }) {
  return <title>{`${title} | FastOS`}</title>
}
