```typescript
// src/utils/tournamentBracketGenerator.ts

export interface Participant {
  id: string;
  name: string;
  seed: number;
}

export interface Match {
  id: string;
  participant1?: Participant;
  participant2?: Participant;
  winner?: Participant;
  round: number;
  matchNumber: number;
}

export interface Group {
  name: string;
  participants: Participant[];
  matches: Match[];
}

/**
 * Generates a single-elimination bracket (fixtures format).
 * Handles odd numbers of participants by giving one a bye in the first round.
 * @param participants The list of participants.
 * @returns An array of matches representing the bracket.
 */
export function generateFixturesBracket(participants: Participant[]): Match[] {
  const matches: Match[] = [];
  const totalParticipants = participants.length;
  
  // Determine participants for the first round (handle byes)
  let participantsForFirstRound = [...participants];
  let byes = 0;
  let numPlayersInRound1 = 0;

  // Find the smallest power of 2 greater than or equal to totalParticipants
  let powerOf2 = 1;
  while (powerOf2 < totalParticipants) {
    powerOf2 *= 2;
  }

  if (powerOf2 > totalParticipants) {
    byes = powerOf2 - totalParticipants;
    numPlayersInRound1 = totalParticipants - byes;
  } else {
    numPlayersInRound1 = totalParticipants;
  }

  // Sort participants by seed for initial pairing
  participantsForFirstRound.sort((a, b) => a.seed - b.seed);

  // Assign byes to the highest seeded players
  const playersWithByes = participantsForFirstRound.slice(0, byes);
  const playersInFirstRound = participantsForFirstRound.slice(byes);

  // Create matches for the first round
  for (let i = 0; i < playersInFirstRound.length; i += 2) {
    matches.push({
      id: `match-1-${matches.length + 1}`,
      participant1: playersInFirstRound[i],
      participant2: playersInFirstRound[i + 1],
      round: 1,
      matchNumber: matches.length + 1
    });
  }

  // Add bye matches (these players advance directly to round 2)
  playersWithByes.forEach(player => {
    matches.push({
      id: `match-1-bye-${player.id}`,
      participant1: player,
      winner: player, // Player with bye automatically wins this "match"
      round: 1,
      matchNumber: matches.length + 1,
      // This match is conceptually a bye, so it's already completed
      // In a real system, you might mark it as 'bye' status
    });
  });

  // Generate subsequent rounds
  let currentRoundMatchesCount = matches.length;
  let round = 2;
  
  while (currentRoundMatchesCount > 1) {
    const nextRoundMatchesCount = Math.ceil(currentRoundMatchesCount / 2);
    
    for (let i = 0; i < nextRoundMatchesCount; i++) {
      matches.push({
        id: `match-${round}-${i + 1}`,
        round,
        matchNumber: i + 1
      });
    }
    
    currentRoundMatchesCount = nextRoundMatchesCount;
    round++;
  }

  return matches;
}

/**
 * Generates a group stage followed by a knockout bracket.
 * @param participants The list of participants.
 * @returns An object containing groups and the knockout bracket.
 */
export function generateGroupStage(participants: Participant[]): { groups: Group[]; knockoutBracket: Match[] } {
  const totalParticipants = participants.length;
  const groupCount = Math.min(4, Math.max(1, Math.floor(totalParticipants / 4))); // Max 4 groups, min 1 if less than 4 participants
  const newGroups: Group[] = [];

  // Create groups
  for (let i = 0; i < groupCount; i++) {
    newGroups.push({
      name: String.fromCharCode(65 + i), // A, B, C, D
      participants: [],
      matches: []
    });
  }

  // Distribute participants into groups (round-robin distribution)
  participants.forEach((participant, index) => {
    const groupIndex = index % groupCount;
    newGroups[groupIndex].participants.push(participant);
  });

  // Generate matches within each group (round robin)
  newGroups.forEach(group => {
    const groupParticipants = group.participants;
    let matchNumber = 1;

    for (let i = 0; i < groupParticipants.length; i++) {
      for (let j = i + 1; j < groupParticipants.length; j++) {
        group.matches.push({
          id: `group-${group.name}-match-${matchNumber}`,
          participant1: groupParticipants[i],
          participant2: groupParticipants[j],
          round: 1, // Group stage matches are all round 1 conceptually
          matchNumber
        });
        matchNumber++;
      }
    }
  });

  // Generate knockout bracket for group winners (assuming 2 qualifiers per group for simplicity)
  const knockoutMatches: Match[] = [];
  const qualifiersPerGroup = 2; // Example: top 2 from each group advance
  const totalQualifiers = groupCount * qualifiersPerGroup;

  // Only generate knockout if there are enough qualifiers for at least one match
  if (totalQualifiers >= 2) {
    // First round of knockout (e.g., Quarter-finals if 8 qualifiers)
    for (let i = 0; i < Math.floor(totalQualifiers / 2); i++) {
      knockoutMatches.push({
        id: `knockout-1-${i + 1}`,
        round: 1,
        matchNumber: i + 1
      });
    }

    // Generate subsequent knockout rounds
    let currentRoundMatchesCount = knockoutMatches.length;
    let round = 2;
    
    while (currentRoundMatchesCount > 1) {
      const nextRoundMatchesCount = Math.ceil(currentRoundMatchesCount / 2);
      
      for (let i = 0; i < nextRoundMatchesCount; i++) {
        knockoutMatches.push({
          id: `knockout-${round}-${i + 1}`,
          round,
          matchNumber: i + 1
        });
      }
      
      currentRoundMatchesCount = nextRoundMatchesCount;
      round++;
    }
  }

  return { groups: newGroups, knockoutBracket: knockoutMatches };
}
```