import { intToRGBA, Jimp } from "jimp";
import { Fast } from "./Fast";
import fs from 'fs'
import { createCanvas, loadImage } from "canvas";
import { Brief } from "./Brief";
import { PointData } from "./types";

const IMG_1 = './img/img1b.png'
const IMG_2 = './img/img2b.png'

const getGreyscaleImage = async (url: string, blur?: number) => {
    const image = await Jimp.read(url)
    let grey = image.color([{apply: 'greyscale'}])
    if (blur) {
        await grey.write(`${url.substring(0, url.indexOf('.png'))}_grey.png`)
        grey = grey.gaussian(blur)
        await grey.write(`${url.substring(0, url.indexOf('.png'))}_blur.png`)
    }
    const { width, height } = grey.bitmap
    const matrix: number[][] = []
    for (let i = 0; i < height; i++) {
        const row: number[] = []
        for (let j = 0; j < width; j++) {
            const col = grey.getPixelColor(j, i)
            const c = intToRGBA(col)
            row.push(c.r)
        }
        matrix.push(row)
    }
    return matrix
}

const main = async () => {
    const img1 = await getGreyscaleImage(IMG_1)
    const img2 = await getGreyscaleImage(IMG_2)
    
    const fast = new Fast(40, 12)
    const corners1 = fast.getCorners(img1)
    console.log('Corners 1', corners1.length)
    const corners2 = fast.getCorners(img2)
    console.log('Corners 2', corners2.length)

    const img12 = await getGreyscaleImage(IMG_1, 2)
    const img22 = await getGreyscaleImage(IMG_2, 2)
    
    const brief = new Brief(256)
    const descriptors1 = brief.getDescriptors(img12, corners1)
    const descriptors2 = brief.getDescriptors(img22, corners2)

    const matches = brief.reciprocalMatch(corners1, descriptors1, corners2, descriptors2)
    console.log('Matches', matches.length)
    fs.writeFileSync('./matches.json', JSON.stringify(matches, null, 2))
}


const printResults = async () => {
    const image1 = await Jimp.read(IMG_1)
    const image2 = await Jimp.read(IMG_2)

    const {width: width1, height: height1} = image1.bitmap
    const {width: width2, height: height2} = image2.bitmap

    const imgWidth = Math.max(width1, width2)

    const canvas = createCanvas(imgWidth, height1 + height2 + 5)
    const ctx = canvas.getContext('2d')

    const img1 = await loadImage(IMG_1)
    const dx1 = width1 === imgWidth ? 0 : Math.floor((imgWidth - width1) / 2)
    ctx.drawImage(img1, dx1, 0, width1, height1)

    const img2 = await loadImage(IMG_2)
    const dx2 = width2 === imgWidth ? 0 : Math.floor((imgWidth - width2) / 2)
    ctx.drawImage(img2, dx2, height1 + 5, width2, height2)


    const matches: PointData[] = JSON.parse(fs.readFileSync('./matches.json', {encoding: 'utf8'}))

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 0, 0, 1)'
    let c = 0
    for (let i = 0; i < matches.length; i++) {
        const m = matches[i]
        if (m.confidence > 0.93) {
            ctx.beginPath();
            ctx.moveTo(m.keypoint1.x + dx1, m.keypoint1.y)
            ctx.lineTo(m.keypoint2.x + dx2, m.keypoint2.y + height1 + 5)
            ctx.stroke()
            c++
        }
    }
    console.log(c)


    const out = fs.createWriteStream('./img/result.jpeg')
    const stream = canvas.createJPEGStream()
    stream.pipe(out)
    out.on('finish', () => console.log('finish'))
}

// main()
printResults()