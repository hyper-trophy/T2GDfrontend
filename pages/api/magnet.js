import { getMagnet } from '../../services'
export default async function handler(req, res) {
    const { torrent } = req.body
    try {
        const magnet = await getMagnet(torrent)
        res.send(magnet)
    } catch (e) {
        console.log(e.message)
        res.status(500)
    }
    return;
}