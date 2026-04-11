import { decodeDeck, decodePlaygroundState } from '../app-browser'

export class ShareAssertions {
  expectHashPresent() {
    expect(window.location.hash).toBeTruthy()
  }

  getSharedMarkdown() {
    return decodeDeck(window.location.hash.slice(1))
  }

  getSharedState() {
    return decodePlaygroundState(window.location.hash.slice(1))
  }
}
