const prefix = "https://ws.audioscrobbler.com/2.0/?api_key=3fdcfe1792c25cf66520c046cece5199&format=json&method="
import * as ls from 'local-storage'

export default class LastFM {
  static getPossibleArtists(artist) {
    return this.getAllResults("artist", artist)
  }
  static getPossibleAlbums(album) {
    return this.getAllResults("album", album)
  }
  static getPossibleTracks(track) {
    return this.getAllResults("track", track)
  }
  static getAllResults(type, query) {
    const url = `${prefix}${type}.search&${type}=${encodeURIComponent(query)}`
    return fetch(url).then(resp => resp.json()).then(({ results }) => results[`${type}matches`][type])
  }
  static getImagesForStations(stations) {
    return Promise.all(stations.map(station => {
      const stored = ls.get(station) || false
      if (stored) {
        return stored
      }

      if (station.includes('Radio')) {
        //Probably an artist
        return LastFM.getPossibleArtists(station.slice(0, -6))
      } else {
        //probably a song
        return LastFM.getPossibleTracks(station)
      }
    })).then(allResults => {
      return allResults.map((result, i) => {
        if (typeof result === 'string') {
          return result === "" ? false : result
        }
        //console.log(result)
        //0th element is probably the one we are looking for
        if (result.length < 1) {
          return false
        }
        const ret = result[0].image.slice(1, 2)[0]['#text']
        ls.set(stations[i], ret)
        return ret
      })
    })
  }
}
