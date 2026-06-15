import { describe, it, expect } from "vitest";

import {
  levelForPoints,
  nextLevel,
  REPUTATION_LEVELS,
} from "@/features/reputation/constants";

describe("levelForPoints", () => {
  it("renvoie le niveau correspondant aux seuils", () => {
    expect(levelForPoints(0).label).toBe("Curieux·se");
    expect(levelForPoints(24).label).toBe("Curieux·se");
    expect(levelForPoints(25).label).toBe("Apprenti·e");
    expect(levelForPoints(100).label).toBe("Maker");
    expect(levelForPoints(99999).label).toBe("Légende");
  });

  it("ne descend jamais sous le premier niveau", () => {
    expect(levelForPoints(-5).label).toBe(REPUTATION_LEVELS[0].label);
  });
});

describe("nextLevel", () => {
  it("pointe vers le palier suivant", () => {
    expect(nextLevel(0)?.label).toBe("Apprenti·e");
    expect(nextLevel(100)?.label).toBe("Bâtisseur·se");
  });

  it("renvoie null au sommet", () => {
    expect(nextLevel(100000)).toBeNull();
  });
});
