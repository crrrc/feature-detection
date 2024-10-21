export class Fast {
    // Umbral de diferencia de intensidad
    private threshold: number
    // Número de pixels consecutivos en el círculo con los que comparar la intensidad
    private n: number

    constructor(threshold: number, n: number) {
        this.threshold = threshold
        this.n = n
    }

    /**
     * @param image Imagen en escala de grises, 8 bits
     * @returns Esquinas encontradas en la imagen
     */
    public getCorners(image: number[][]) {
        const height = image.length;
        const width = image[0].length

        const corners: {x: number, y: number}[] = []
        
        for (let i = 15; i < height - 15; i++) {
            for (let j = 15; j < width - 15; j++) {                
                if (this.isCorner(image, j, i)) {
                    corners.push({x: j, y: i})
                    j += 3
                }
            }
        }

        return corners
    }

    /**
     * Obtiene el círculo de Bresenham de radio 3 para un píxel de la imagen, con los siguientes índices para los píxeles del círculo
     *       15 00 01
     *    14          02
     * 13                03
     * 12       p       04
     * 11                05
     *    10          06
     *       09 08 07
     * @param image Imagen en escala de grises, 8 bits
     * @param x Coordenada x del píxel
     * @param y Coordenada y del píxel
     * @returns Círculo de Bresenham de radio 3
     */
    private getCirclePixels(image: number[][], x: number, y: number) {
        return [
            image[y-3][x],
            image[y-3][x+1],
            image[y-2][x+2],
            image[y-1][x+3],
            image[y][x+3],
            image[y+1][x+3],
            image[y+2][x+2],
            image[y+3][x+1],
            image[y+3][x],
            image[y+3][x-1],
            image[y+2][x-2],
            image[y+1][x-3],
            image[y][x-3],
            image[y-1][x-3],
            image[y-2][x-2],
            image[y-3][x-1],
        ]
    }

    /**
     * @param image Imagen en escala de grises, 8 bits
     * @param x Coordenada x del píxel
     * @param y Coordenada y del píxel
     * @returns true si el punto es una esquina
     */
    private isCorner = (image: number[][], x: number, y: number) => {
        const p = image[y][x]
        const circlePixels = this.getCirclePixels(image, x, y)
        // Se realiza una comprobación inicial básica, para descartar una esquina
        if (this.isExcluded(p, circlePixels)) return false
    
        // Se buscan n puntos consecutivos del círculo que sean más luminosos o más oscuros que el candidato
        // El bucle realia 24 iteraciones, para ser capaz de comparar el píxel de índice 15 con los 8 siguientes
        let darker = 0
        let brighter = 0
        for (let i = 0; i < 24; i++) {
            let j = i % 16
            
            const pixel = circlePixels[j]
            if (this.isBrighter(p, pixel)) {
                brighter++
                darker = 0
            } else if (this.isDarker(p, pixel)) {
                darker++
                brighter = 0
            } else {
                brighter = 0
                darker = 0
            }

            if (brighter === this.n || darker === this.n) {
                return true
            }
        }
        return false
    }

    /**
     * Compara el candidato a esquina con los píxeles superior, inferior, derecho e izquierdo, y lo marca como descartado si no hay al menos 3 que seam más brillantes u oscuros que el candidato
     * @param p Candidato a esquina
     * @param circlePixels Círculo de Bresenham
     * @returns true si el punto se excluye como esquina al no darse las condiciones básicas
     */
    private isExcluded = (p: number, circlePixels: number[]): boolean => {
        const bottom = circlePixels[8]
        const left = circlePixels[12]
        const right = circlePixels[4]
        const top = circlePixels[0]
    
        let count = 0
        if (this.isBrighter(p, top)) count++
        if (this.isBrighter(p, right)) count++
        if (this.isBrighter(p, bottom)) count++
        if (this.isBrighter(p, left)) count++
    
        if (count >= 3) return false
    
        count = 0
        if (this.isDarker(p, top)) count++
        if (this.isDarker(p, right)) count++
        if (this.isDarker(p, bottom)) count++
        if (this.isDarker(p, left)) count++
    
        return count < 3
    }

    /**
     * @param p Candidato a esquina
     * @param pixel Píxel a comparar
     * @returns True si el píxel a comparar es más luminoso que el candidato, en función del umbral
     */
    private isBrighter(p: number, pixel: number): boolean {
        return pixel - p > this.threshold
    }
    
    /**
     * @param p Candidato a esquina
     * @param pixel Píxel a comparar
     * @returns True si el píxel a comparar es más oscuro que el candidato, en función del umbral
     */
    private isDarker(p: number, pixel: number) {
        return p - pixel > this.threshold
    }
    
}