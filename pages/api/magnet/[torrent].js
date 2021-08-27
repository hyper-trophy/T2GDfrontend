import { getMagnet } from '../../../services'
export default async function handler(req, res) {
    const { torrent } = req.query 
    const magnet = await getMagnet(torrent).catch(err=>console.log)
    res.send(magnet)
}