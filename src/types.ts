export type Point = {
    x: number,
    y: number
}

export type PointData = {
    index1: number,
    index2: number,
    keypoint1: Point,
    keypoint2: Point,
    confidence: number,
    d1?: string,
    d2?: string,
}