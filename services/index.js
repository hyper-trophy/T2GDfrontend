import TorrentSearchApi from 'torrent-search-api';

const providers = ["1337x", "ThePirateBay", "limetorrents", "Rarbg", "Yts"];

const searchTorrents = async (searchQuery) => {
  providers.map(ele => 
      TorrentSearchApi.enableProvider(ele))
  const torrents = await TorrentSearchApi.search(providers, searchQuery, null, 30);
  return torrents;
};

const getMagnet = (torrent) => 
    TorrentSearchApi.getMagnet(torrent);

export {
  searchTorrents,
  getMagnet
};

