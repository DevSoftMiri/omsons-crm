import { SegmentBuilderPage } from "@/features/segments/segment-builder-page";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <SegmentBuilderPage segmentId={id} />; }
