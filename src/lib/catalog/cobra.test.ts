import { describe, expect, it } from "vitest";
import { parseCobraDeckPage } from "./cobra";

const deckPage = `
  <html><body>
    <table><thead><tr><th>Corp Deck</th></tr></thead><tbody><tr><td>Megacity Méliès</td></tr></tbody></table>
    <table><thead><tr><th>Min</th><th>Identity</th><th>Max</th></tr></thead><tbody><tr><td>45</td><td> Méliès U: Only the Brightest</td><td>15</td></tr></tbody></table>
    <table><thead><tr><th>Qty</th><th>Card Name</th><th>Inf</th></tr></thead><tbody>
      <tr><td>3</td><td> Hedge Fund</td><td></td></tr>
      <tr><td>2</td><td>Spin Doctor</td><td>2</td></tr>
    </tbody></table>
    <table><tbody><tr><td>5</td><td>Totals</td><td>2</td></tr></tbody></table>
    <table><thead><tr><th>Runner Deck</th></tr></thead><tbody><tr><td>Megacity Seb</td></tr></tbody></table>
    <table><thead><tr><th>Min</th><th>Identity</th><th>Max</th></tr></thead><tbody><tr><td>45</td><td> Sebastião Souza Pessoa: Activist Organizer</td><td>15</td></tr></tbody></table>
    <table><thead><tr><th>Qty</th><th>Card Name</th><th>Inf</th></tr></thead><tbody>
      <tr><td>3</td><td>Sure Gamble</td><td></td></tr>
      <tr><td>1</td><td>Dr. Nuka Vrolyck</td><td>2</td></tr>
    </tbody></table>
    <table><tbody><tr><td>4</td><td>Totals</td><td>2</td></tr></tbody></table>
  </body></html>`;

const embeddedDeckPage = `
  <html><body>
    <input id="corp_deck" type="hidden" value='{"details":{"side_id":"corp","name":"High Speed Rail","identity_title":"Haas-Bioroid: Precision Design","nrdb_uuid":"9267c651-19e8-4f50-808b-26c3a6de799a"},"cards":[{"title":"Ablative Barrier","quantity":3,"influence":0,"card_type_id":"ice"},{"title":"Flood the Market","quantity":2,"influence":6,"card_type_id":"operation"}]}' />
    <input id="runner_deck" type="hidden" value='{"details":{"side_id":"runner","name":"Omnivore - Direct","identity_title":"René “Loup” Arcemont: Party Animal","nrdb_uuid":"40348942-d2c6-433a-9128-2b25c7f6517f"},"cards":[{"title":"Sure Gamble","quantity":3,"influence":0,"card_type_id":"event"},{"title":"Dr. Nuka Vrolyck","quantity":2,"influence":4,"card_type_id":"resource"}]}' />
  </body></html>`;

describe("parseCobraDeckPage", () => {
  it("extracts both submitted sides into display-ready rows", () => {
    const result = parseCobraDeckPage(deckPage);
    expect(result.corp).toMatchObject({
      side: "corp",
      title: "Megacity Méliès",
      identity: "Méliès U: Only the Brightest",
      cardCount: 5,
      influenceTotal: 2,
    });
    expect(result.corp?.cards).toEqual([
      { title: "Hedge Fund", quantity: 3 },
      { title: "Spin Doctor", quantity: 2, influence: 2 },
    ]);
    expect(result.runner).toMatchObject({
      side: "runner",
      title: "Megacity Seb",
      identity: "Sebastião Souza Pessoa: Activist Organizer",
      cardCount: 4,
    });
  });

  it("returns only the available side when a page is partial", () => {
    const corpOnly = deckPage.slice(0, deckPage.indexOf("<table><thead><tr><th>Runner Deck"));
    const result = parseCobraDeckPage(corpOnly);
    expect(result.corp?.cards).toHaveLength(2);
    expect(result.runner).toBeUndefined();
  });

  it("extracts Cobra's current embedded JSON deck format", () => {
    const result = parseCobraDeckPage(embeddedDeckPage);
    expect(result.corp).toMatchObject({
      side: "corp",
      title: "High Speed Rail",
      identity: "Haas-Bioroid: Precision Design",
      cardCount: 5,
      influenceTotal: 6,
      nrdbUrl: null,
    });
    expect(result.corp?.cards).toEqual([
      { title: "Ablative Barrier", quantity: 3, influence: 0, type: "ice" },
      { title: "Flood the Market", quantity: 2, influence: 6, type: "operation" },
    ]);
    expect(result.runner).toMatchObject({
      title: "Omnivore - Direct",
      cardCount: 5,
      influenceTotal: 4,
    });
  });

  it("returns no decks for unrelated or malformed markup", () => {
    expect(parseCobraDeckPage("<html><table><tr><td>No deck</td></tr></table></html>"))
      .toEqual({});
  });
});
