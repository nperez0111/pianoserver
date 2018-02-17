const prefix = "http://ws.audioscrobbler.com/2.0/?api_key=3fdcfe1792c25cf66520c046cece5199&format=json&method="

export default class LastFM {
  getPossibleArtists(artist) {
    return this.getAllResults("artist", artist)
  }
  getPossibleAlbums(album) {
    return this.getAllResults("album", album)
  }
  getPossibleTracks(track) {
    return this.getAllResults("track", track)
  }
  getAllResults(type, query) {
    const url = `${type}.search&${type}=${encodeURIComponent(query)}`
    return fetch(url).then(resp => resp.json()).then(({ results }) => results[`${type}matches`][type])
  }
}
