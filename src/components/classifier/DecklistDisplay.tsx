import { Decklist } from "@/app/mlstuff/page";
import { List, ListItem } from "@mantine/core";

export const CARD_TYPES = [
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

export const sortDecklist = (decklist: Decklist) => {
  return decklist.sort((a, b) => {
    if (a.card_type === b.card_type) {
      return a.card_name.localeCompare(b.card_name);
    }
    return CARD_TYPES.indexOf(a.card_type) - CARD_TYPES.indexOf(b.card_type);
  });
};

export default function DecklistDisplay({ decklist }: { decklist: Decklist }) {
  sortDecklist(decklist);
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
