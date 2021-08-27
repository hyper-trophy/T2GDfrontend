import { searchTorrents } from '../../../services'
export default async function handler(req, res) {
    const { searchQuery } = req.query 
    const result = await searchTorrents(searchQuery)
    res.status(200).json(result)
}