import { Point, PointData } from "./types";

export class Brief {
    private count: 128 | 256 | 512
    private randomOffsets: [Point, Point][]

    constructor(count: 128 | 256 | 512) {
        this.count = count;
        this.randomOffsets = this.getRandomWindowOffsets()
    }

    public getDescriptors(image: number[][], corners: Point[]) {
        const descriptors: number[][] = []
        let descriptorWord = 0

        for (let i = 0; i < corners.length; i ++) {
            const descriptor: number[] = []
            for (let j = 0; j < this.count; j++) {
                const [a, b] = this.randomOffsets[j]
                if (image[a.y + corners[i].y][a.x + corners[i].x] < image[b.y + corners[i].y][b.x + corners[i].x]) {
                    descriptorWord |= 1 << (j & 31)
                }

                if (((j+1) & 31) === 0) {
                    descriptor.push(descriptorWord)
                    descriptorWord = 0
                }
            }
            descriptors.push(descriptor)
        }
        return descriptors
    }

    private getRandomWindowOffsets = () => {
        const offsets: [Point, Point][] = []
        for (let i = 0; i < this.count; i++) {
            offsets.push([
                { x: this.uniformRandom(15), y: this.uniformRandom(15) }, 
                { x: this.uniformRandom(15), y: this.uniformRandom(15) }, 
            ])
        }
        return offsets
    }

    private uniformRandom (n: number) {
        return Math.floor(Math.random() * (2 * n + 1)) - n;
    }

    public reciprocalMatch(corners1: Point[], descriptors1: number[][], corners2: Point[], descriptors2: number[][]) {
        const matches: PointData[] = []
        if (!corners1.length || !corners2.length) return matches
    
        const m1 = this.match(corners1, descriptors1, corners2, descriptors2)
        const m2 = this.match(corners2, descriptors2, corners1, descriptors1)
        
        for (let i = 0; i < m1.length; i++) {
            if (m2[m1[i].index2].index2 === i) {
                matches.push(m1[i])
            }
        }
        return matches
    }

    private match(corners1: Point[], descriptors1: number[][], corners2: Point[], descriptors2: number[][]) {
        const l1 = corners1.length;
        const l2 = corners2.length;
        const matches: PointData[] = []
    
        for (let i = 0; i < l1; i++) {
            let min = Infinity
            let minJ = 0
            for (let j = 0; j < l2; j++) {
                let dist = 0;
                for (let k = 0; k < descriptors1[i].length; k++) {
                    dist += this.countBits(descriptors1[i][k] ^ descriptors2[j][k])
                    if (dist >= min) break
                }
                if (dist < min) {
                    min = dist
                    minJ = j
                }
                if (min === 0) break
            }
            matches.push({
                index1: i,
                index2: minJ,
                keypoint1: corners1[i],
                keypoint2: corners2[minJ],
                confidence: 1 - min/this.count
            })
        }
        return matches
    }

    private countBits (n: number) {
        const s = n.toString(2)
        return s.split('').reduce((acc, current) => current === '1' ? acc + 1 : acc, 0)
    }
    
}