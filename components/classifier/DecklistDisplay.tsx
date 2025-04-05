import { Decklist } from "@/app/classifier/page";
import { List, ListItem } from "@mantine/core";

const CARD_TYPES = [
  "identity",
  "agenda",
  "asset",
  "operation",
  "upgrade",
  "ice",
  "event",
  "hardware",
  "resource",
  "program",
];

export default function DecklistDisplay({ decklist }: { decklist: Decklist }) {
  decklist.sort((a, b) => {
    if (a.card_type === b.card_type) {
      return a.card_name.localeCompare(b.card_name);
    }
    return CARD_TYPES.indexOf(a.card_type) - CARD_TYPES.indexOf(b.card_type);
  });
  return (
    <List>
      {decklist.map((card) => (
        <ListItem key={card.card_name}>
          {card.card_name} ({card.card_count})
        </ListItem>
      ))}
    </List>
  );
}
