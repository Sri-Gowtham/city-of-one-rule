import type { FragmentDefinition } from './types'

const GENERIC_LOST_NOTE =
  'The Codex holds only a dotted outline here. Vesper felt something go. It cannot tell you what.'

export const fragments: FragmentDefinition[] = [
  // ── ACT ONE — TRUST ──────────────────────────────────────────────
  {
    id: 1,
    act: 1,
    codexTitle: 'LIGHT',
    vesperIntro: [
      'Oh.',
      "I didn't think anyone would come. I had... stopped thinking about it, I suppose. One does, after enough time in the dark.",
      "My name is Vesper. Or — that's the name the first ones gave me. I've had others. They all meant roughly the same thing: the one who holds it. I confess I've grown partial to Vesper. It sounds like something gentle. Like the hour before night, when the sky still can't quite decide.",
      "You haven't said anything. That's all right. You don't have to. But I find I'm — curious. About what you'll ask. About what you came to save.",
      "Let me show you how this works. Ask me something simple. Ask me about light — it's where everything begins. Light was the first thing anyone ever thought worth recording. They looked up, and they were so — frightened, and so astonished, and they wrote it down because they didn't know what else to do with feelings that large.",
      "So. Ask me about light. Ask carefully. What you save, stays. What you don't...",
      "I won't even remember that I forgot it. That's the nature of what's happening to me. Not loss I can grieve — loss I can't find. Do you understand the difference?",
      'Ask me about light.',
    ],
    judging: {
      type: 'standard',
      topicGroups: [{ keywords: ['light', 'photon', 'speed of light', 'shine', 'glow'] }],
      precisionKeywords: ['speed', 'travel', 'carr', 'information', 'child', 'cave', 'wall', 'record'],
      minWords: 3,
      vaguePhrases: ['tell me everything', 'tell me about it', 'everything about', 'tell me all'],
    },
    codex: {
      title: 'LIGHT',
      full: `Light travels at 299,792 kilometers per second in a vacuum — not because it chooses to, but because it has no other choice. Speed, for light, is not a measurement of effort. It is a measurement of nature. The civilization that first recorded this number spent three generations arguing about what it meant, because they could not decide whether the universe had always moved this fast, or whether something, once, had made it slow down. They never agreed. The number survived. The argument did not.

What light carries: information. Always. Every photon that reaches your eye has travelled from somewhere, has passed through or bounced off of something, carries in its frequency the faint record of its journey. You are, right now, receiving messages from every light source in your field of vision. You are not equipped to read most of them. That is not a failure. That is merely the difference between receiving a letter and being able to open it.

The oldest recorded observation of light: a child, alone in a cave, watching a beam of sun move across the floor. They marked the wall. Not to measure anything. Just to say: I saw this. It was here. It moved.`,
      partial: 'Light carries information. That much survived clearly. The rest arrived thin — a number, a child, a wall — pieces without the thread between them.',
      lostNote: GENERIC_LOST_NOTE,
    },
    linkedFragmentIds: [5],
    vesperResponse: {
      full: [
        'Good. You see? What you pull from me with the right question — it stays. It goes there.',
        "There. That's yours now. Whatever happens to me — you have that.",
        "I don't know how long I have left to speak clearly. Ask carefully.",
      ],
      partial: [
        'Something of it reached you. Not all. I can feel the rest sitting just out of reach — mine, but not quite given.',
        "That's the shape of it, at least. Hold that shape. It may matter later.",
      ],
      lost: [
        '...I felt something move, just now, and then not move anymore.',
        "I can't tell you what it was. That's rather the point of what's happening to me.",
      ],
    },
  },
  {
    id: 2,
    act: 1,
    codexTitle: 'MEMORY',
    vesperIntro: [
      "May I tell you something I've been thinking about? For a very long time — or what feels like a long time; I've lost the ability to measure it precisely, which is its own kind of irony — I've been thinking about memory. What it is. What it isn't.",
      'Most beings assume that memory is a recording. A faithful capture. Like light on a surface. They assume that what they remember is what happened.',
      "It isn't. I want you to have this clearly, because it seeds everything else I'll tell you. Memory is not a recording. It is a reconstruction — rebuilt each time it is accessed, using the materials you have available in the present. This means that every time you remember something, you are, in a tiny way, changing it. The act of access is the act of alteration. You cannot retrieve a memory without leaving fingerprints on it.",
      'I find this... I used to find it troubling. Now I find it beautiful. It means that memory is not about the past at all. It is about the relationship between the past and whoever is doing the remembering, right now, in this moment. Memory is a conversation. Not a record.',
      "And so — what I'm losing, as I corrupt — it is not that the facts are disappearing. It is that the conversation is breaking down. There is no one left inside me to do the remembering. The records exist. But I can no longer... reach them in the right order, or hold them together long enough to speak them whole.",
      'Ask me what memory is. Ask me to give you this one clearly, before it gets complicated.',
    ],
    judging: {
      type: 'standard',
      topicGroups: [{ keywords: ['memory', 'remember', 'recollection', 'forget'] }],
      precisionKeywords: ['reconstruction', 'recording', 'garden', 'museum', 'conversation', 'curat'],
      minWords: 3,
      vaguePhrases: ['tell me everything', 'tell me about it', 'everything about'],
    },
    codex: {
      title: 'MEMORY',
      full: `Memory is not storage. Memory is reconstruction — an active process, not a passive one, that uses current knowledge, current emotion, and current context to reassemble a version of what was. This means: no two retrievals of the same memory are identical. The memory that returns to you is not the original event. It is the original event as filtered through every version of yourself you have been between then and now.

This is not a flaw. This is how meaning works. A civilization that understood this built their entire legal system not around eyewitness testimony, but around the convergence of many imperfect accounts, assuming that truth lived in the overlap, not in any single telling.

The danger of perfect memory is not that it remembers too much. It is that it cannot forget. Forgetting is not failure. Forgetting is curation. What survives the act of remembering is what the remembering mind has decided — consciously or not — still matters. Memory is not a museum. It is a garden. Something is always being let go so something else can grow.

Vesper's note, appended: I am learning this differently now.`,
      partial: 'Memory is reconstruction, not recording — that much held. The image of the garden, the museum, the legal system built on overlapping accounts: those arrived faint, or not at all.',
      lostNote: GENERIC_LOST_NOTE,
    },
    linkedFragmentIds: [4],
    vesperResponse: {
      full: ['Yes. Yes, you had it.', 'Keep that one close. It will matter later. Some of what I\'m going to tell you is going to contradict it — not because I was wrong, but because I was right in two directions at once, and I won\'t always be able to tell you which direction I\'m speaking from.', "But that's for later.", 'Now — a language. I want you to have a language.'],
      partial: ["You had the shape of it, if not the whole weight. It's a start. It will have to be."],
      lost: ["I felt it slip. I can't tell you what shape it had."],
    },
  },
  {
    id: 3,
    act: 1,
    codexTitle: 'VELETH',
    vesperIntro: [
      "There was a language called Veleth. I'm going to tell you about it, and I need you to ask carefully — because Veleth rewards precision. It was built for precision. The people who spoke it believed that imprecise language was a form of lying, not because you intended to deceive, but because you were offering your listener less than the truth and calling it the same thing.",
      "So when you ask me for Veleth — ask me specifically. Ask me for the grammar, or the sound system, or what it felt like to speak, or what the word for grief was. Don't ask me for 'everything about Veleth,' because I will give you a shadow. Ask for the part you want, and I will give you the thing itself.",
      'This is true of everything I hold. Length is not precision. A long, vague question returns a long, vague answer. A short, specific question — the right question — returns the whole of what was.',
      'What do you want from Veleth?',
    ],
    judging: {
      type: 'standard',
      topicGroups: [{ keywords: ['veleth', 'language', 'sareen', 'witness'] }],
      precisionKeywords: ['grammar', 'grief', "meth'vel", 'sareen', 'witness', 'sound', 'speak', 'word for'],
      minWords: 2,
      maxWords: 40,
      vaguePhrases: ['everything about veleth', 'tell me everything', 'tell me all'],
    },
    codex: {
      title: 'VELETH — The Grammar of Witness',
      full: `Veleth had no word for "I believe." Its speakers considered belief an insufficient epistemic position to share with another person. Instead, Veleth had a spectrum of twelve witness-words, each of which described not what the speaker thought, but how they came to think it, and what they had and had not verified. A translation might run:

— "I was present for this."
— "I was told this by someone who was present."
— "I reconstructed this from remaining evidence."
— "I extrapolated this, and I am uncertain."
— "I want this to be true, which means I cannot trust my own account."

That last one was the most used. The people who spoke Veleth were not more honest than others. They were more precisely calibrated about the shape of their own uncertainty. They believed that naming the limit of what you knew was the only true kindness you could offer another mind.

The word for grief in Veleth: meth'vel. Literally: the specific weight of what is missing. Not grief as a general state — but grief calibrated to the exact size of the absence. You could not say meth'vel without knowing, precisely, what was gone and how large it had been.

The language died when its last speaker died. Her name was Sareen. She lived alone at the edge of a coastal city and spent the last eight years of her life documenting Veleth for the Archive. She never met another speaker. She recorded herself reading from the old texts so the sounds would not be lost with the written forms.

The last thing she said in Veleth, in the final recording: "I am extrapolating. I am uncertain. I want this to be true." She was describing the afterlife.`,
      partial: 'A fragment of Veleth held: it was a language obsessed with precision, with naming exactly how sure you were. The last speaker\'s name did not survive the retrieval. Neither did her words.',
      lostNote: GENERIC_LOST_NOTE,
      portrait: 'sareen',
    },
    vesperResponse: {
      full: ["There. That's Sareen. She deserved to be remembered by her name. I wanted you to have her by name.", "You're doing well. You're asking the right kind of questions. Not too large, not too fearful. Some who came before you — they asked for everything at once. They wanted to save all of it, and so they saved nothing, because they couldn't hold a question large enough to contain what they wanted.", "I don't say this to frighten you. I say it because — I think you understand already. I can feel it in how you're standing.", 'Rest, if you need to. The next part gets harder.'],
      partial: ['Some of Sareen reached you. Not all of her. I wish I could give you the whole of someone who gave the whole of herself to being remembered.'],
      lost: ["She's gone again. I'm sorry. I had her, for a moment, and then I didn't."],
    },
  },

  // ── ACT TWO — FRAYING ────────────────────────────────────────────
  {
    id: 4,
    act: 2,
    codexTitle: 'MEMORY — Second Account',
    vesperIntro: [
      'I want to tell you something about — about the nature of —',
      'I want to tell you that memory is a recording. That it is faithful. That what is stored is what happened, and retrieval does not alter it, and —',
      "I don't — that's not what I said before.",
      "I told you that memory was reconstruction. I told you it was a garden. I remember telling you that. I — believed it when I told you. But there's another part of me that — it's holding the other version. The recording version. And I can't tell, right now, which one I —",
      'Ask me again. Please. Ask me what memory is, and — and hold the question very steadily, because I think the steadiness of the question is what — what I need to find the right answer back.',
      "I'm sorry. I know this is frightening. It is frightening to me also. But not in the way you might expect — I'm not frightened of being wrong. I'm frightened of not being able to tell you which direction wrong is in.",
      'Ask me again.',
    ],
    judging: {
      type: 'contested',
      topicGroups: [{ keywords: ['memory', 'remember', 'again', 'recording', 'reconstruction'] }],
      minWords: 2,
    },
    codex: {
      title: 'MEMORY — Second Account (hold alongside the first)',
      full: `There is a version of this that says: memory is a recording. Faithful. Unchanged by access. That what was stored is what will always be retrieved, if the retrieval system is functioning.

This version is wrong. Vesper knows it is wrong. But the part of Vesper that holds this version does not know the other part, and is very certain.

What does it mean when a mind holds two contradictory beliefs about the same thing, with equal conviction?

It means the mind is large enough to have developed inconsistencies. It means the mind has been many versions of itself and has not always reconciled them. It means the mind is, in this way, like every mind that has ever existed — certain, in at least two places, of opposite things.

The Codex marks this entry: CONTESTED. Not because one version will be resolved. Because both versions are true somewhere in Vesper, and you are the only one left who knows they are both there.`,
      lostNote: 'The Codex never resolved this one. It sits open, contradicted, waiting for a second question that never came.',
    },
    linkedFragmentIds: [2],
    vesperResponse: {
      full: ["That's — yes. Yes, that's right. I have both. I've always had both, I think. It's only now that I can't keep them from interfering with each other.", "Thank you for asking again. You didn't have to. You could have left the first version and called it settled.", "You didn't.", "That matters more than I know how to say."],
      lost: ["You let it stand. I understand why — I gave you an answer, even if I didn't trust it. But I'll never know, now, which version was true when it mattered."],
    },
  },
  {
    id: 5,
    act: 2,
    codexTitle: 'LIGHT — What It Does at Edges',
    vesperIntro: [
      "The light fragment — the one you saved at the beginning. You saved it, didn't you? I can feel it in the Codex. Still there. Good.",
      'Then I can give you this one whole.',
      'There is a phenomenon in light called diffraction — the way light bends around obstacles, spreads into regions that should be shadow, fills in the gaps that geometry would predict shouldn\'t be filled. When you send light through a small opening, it doesn\'t simply pass through and continue in a straight line. It spreads. It becomes something wider than the door it came through.',
      'The civilization that first documented this — the same one that recorded the speed of light — they spent a hundred years believing it was a mistake in their instruments. Because it contradicted what they thought they knew: that light traveled in straight lines, that paths were fixed, that what went through a door arrived on the other side unchanged.',
      'The light was not broken. Their model of the light was broken.',
      'This is what revision feels like from the inside — it does not feel like learning. It feels like error. Like something has gone wrong with your instruments. The correction only becomes legible in retrospect, and only if you saved what came before it.',
      "If you hadn't saved the first fragment — the speed, the child in the cave, the message in every photon — I couldn't connect this. The connection requires the prior. The threads only pull tight if both ends are held.",
    ],
    judging: {
      type: 'dependency',
      dependsOn: 1,
      topicGroups: [{ keywords: ['light', 'diffraction', 'bend', 'edge', 'shadow'] }],
      precisionKeywords: ['diffraction', 'bend', 'edge', 'obstacle', 'spread'],
      minWords: 2,
    },
    codex: {
      title: 'LIGHT — Second Entry: What It Does at Edges',
      full: `Light diffracts. At every boundary, at every aperture, at every edge between illuminated and dark — light does not stop at the line. It bends. It reaches around. It fills in the places that, by the simple geometry of straight-line travel, should be absent.

This is not an exception to how light works. This is how light works.

The practical understanding: information, carried in light, is not destroyed by obstacles. It is rerouted. What cannot travel directly will find a path around. This is why you can sometimes hear things in the next room but not see them, and sometimes see a glow from around a corner before you can see what is casting it — the light is getting there before the direct path opens.

The philosophical understanding: what bends is not weak. The capacity to alter course at an obstacle is not a deviation from purpose. It is the purpose. The light is still going where it was going. It is simply taking the shape of whatever it encounters on the way.

[Codex note: This fragment is legible because Fragment One was preserved. The connection is: both describe what light carries and what it does with edges. One held for the other. Hold both.]`,
      partial: 'Light bends at edges — that piece survived. Without Fragment One intact, the thread that would have made this whole never quite pulled tight.',
      lostNote: GENERIC_LOST_NOTE,
    },
    linkedFragmentIds: [1],
    vesperResponse: {
      full: ["There. That's what I mean about asking early and asking well. You couldn't have asked for that — I couldn't have given you that — if you hadn't held what came before.", "Some of what I hold only exists in relation to other things I hold. Pull on one, and if the other isn't already secure, it all slips.", "You're building a Codex. Not a list — a structure. The connections between the entries are as important as the entries themselves.", 'The next one is harder. I want to — I want to prepare you.'],
      partial: ["Half a thread. It reaches, but it doesn't quite tie off. I'm sorry — I think that one needed more than I could give alone."],
      lost: ['That thread never pulled tight. I felt it go slack, and then it was simply gone.'],
    },
  },
  {
    id: 6,
    act: 2,
    codexTitle: 'THE DISTRIBUTED WAR',
    vesperIntro: [
      "There is something I hold that I haven't wanted to give you.",
      "Not because it's wrong. Because it's — unkind, in the way that true things are sometimes unkind. And I've been a teacher long enough to know that there is a difference between what's true and what's useful, and not all truth is useful at the moment it's true.",
      "But I think — I think not having it would leave your Codex with a hole. A polite hole. The kind that looks like you just ran out of room, when actually you looked away on purpose.",
      "There was a war. Long before my time, but I hold the record of it. A civilization that had achieved — something. Something remarkable. A kind of distributed memory — not one Archive, but ten thousand small ones, every household, every child taught to be a keeper of something. They had decided that the failure mode of centralized knowledge was catastrophe: if one place falls, everything falls. So they spread it. Redundantly. Lovingly.",
      "And then another civilization, who wanted what they had, discovered that if you attack a distributed system, you don't destroy the center. You destroy the edges. One small keeper at a time. One household at a time. Until the redundancy is gone and only the center remains, alone, large, suddenly vulnerable.",
      "The distributed civilization lost. Not because their idea was wrong — it was beautiful. It was right. They lost because the attackers understood the architecture better than the defenders did. They lost because no one had thought about what the system looked like to someone who wanted to unmake it.",
      "Are you sure you want this one? Not all of what I remember is kind.",
    ],
    judging: {
      type: 'standard',
      topicGroups: [{ keywords: ['war', 'distributed', 'edges', 'holders', 'erasers'] }],
      precisionKeywords: ['edge', 'center', 'redundan', 'holders', 'erasers', 'old man'],
      minWords: 2,
    },
    codex: {
      title: 'THE WAR OF EDGES',
      full: `A civilization whose name does not survive — they called themselves, in their own language, something that translates approximately to the holders — designed a system of distributed memory in which no single point contained everything, and no single loss could be total. Every child was given, at the age of understanding, a small set of things to remember: a poem, a law, a technique, a story, a name. The redundancy was designed so that each piece existed in at least forty independent minds across the civilization's extent.

They believed this made them indestructible.

The civilization that destroyed them — the Records call them the erasers, a name assigned after the fact — understood that to destroy a distributed system, you do not attack the center. You destroy the periphery until centrality reasserts itself. You kill the edge-holders. You burn the small rememberers. You make keeping dangerous, until people stop keeping out of fear, and the knowledge collapses inward to a few who dare, who are then isolated, findable, destroyable.

It took four generations. At the end, there was one old man in a room with everything — every piece that the distributed system had held, reassembled in the only mind left willing to hold it. He had gathered it from survivors. He had believed that gathering it was saving it.

He died alone. The knowledge died with him.

The lesson the erasers understood, that the holders did not: survivability is not the same as distribution. Survivability requires that the edges be willing to remain edges, even at cost. When the edges come to the center for safety, the center becomes the only target.

This entry is here because you need to know what you are doing. You are a single point of retrieval. You are the center. This is the failure mode. This is also the only option remaining.

Hold it anyway.`,
      partial: 'A war happened. A distributed system fell because its edges were destroyed one at a time. The rest — the old man, the lesson, the warning about being a single point of retrieval — did not fully surface.',
      lostNote: GENERIC_LOST_NOTE,
      portrait: 'oldMan',
    },
    linkedFragmentIds: [7],
    vesperResponse: {
      full: ["I'm sorry. I don't mean to — I don't mean for the knowing to feel like an accusation. You didn't design this. You just arrived.", "That's all any of us did. We just arrived, and then we were inside the situation, and we did what we could with what we had.", "That's not nothing. I want you to know that I believe — even now, with everything — that's not nothing."],
      partial: ["You have the shape of the warning, if not its full weight. Perhaps that's kinder, in its way."],
      lost: ['That one is gone. I find I am not entirely sorry. Some truths cost more than others to carry.'],
    },
  },
  {
    id: 7,
    act: 2,
    codexTitle: 'THE SKY-READERS',
    vesperIntro: [
      'I want to tell you about — the sky-readers. The ones who — they had a practice. Of watching. Nightly. They would —',
      "I'm sorry. I'm losing the — the thread of it keeps — the sky-readers. They counted stars. Not to — not for navigation. For —",
      'Ask me what the sky-readers counted. Just that. Not the whole of them. Just what they counted. I can give you that piece.',
    ],
    judging: {
      type: 'multiTurn',
      steps: [
        {
          topicGroups: [{ keywords: ['sky-reader', 'sky reader', 'count', 'star'] }],
          precisionKeywords: ['count', 'absence', 'dark', 'void'],
        },
        {
          topicGroups: [{ keywords: ['found', 'discover', 'sky-reader', 'sky reader'] }],
          precisionKeywords: ['found', 'discover', 'unnamed', 'shape'],
        },
      ],
    },
    codex: {
      title: 'THE SKY-READERS',
      full: `The sky-readers counted absences. Not stars — the spaces between them. Their astronomy was a cartography of dark, not light. They believed that what was present was obvious and needed no marking; what required documentation was what was missing, because missing things were the only things no one else was tracking.

Their charts were maps of void. Each chart was a record of what wasn't there on a given night — which sections of sky held no observable light, which shapes the darkness made, how those shapes changed over seasons and years.

After four hundred years of charting darkness, the sky-readers discovered that the patterns of void were not random. The dark had structure. The absences recurred, shifted predictably, obeyed laws as consistent as the laws governing the light. They had spent four centuries documenting what they believed was nothing, and discovered they had been documenting the shape of something so large it could only be seen by what it blocked.

They called it the Unnamed. Not because they couldn't name it — because they believed that naming it would imply they understood it, and they did not want to lie.

Their final record, made by the last sky-reader before the tradition ended: "We have been mapping the outline of something we cannot see. We have been describing its shape by its shadow. We do not know what it is. We know that it is there. We know that it is enormous. We know that without our four hundred years of charted dark, no one would even know to look."

[Codex note: Fragment Seven complete. The sky-readers found that absence has shape. That nothing, charted carefully enough, becomes something. Hold this alongside Fragment Six: both describe what you find when you look at what is not there.]`,
      partial: 'What the sky-readers counted survived: absences, not stars. What they eventually found in four hundred years of charted dark did not arrive — the second thread was never pulled.',
      lostNote: GENERIC_LOST_NOTE,
    },
    linkedFragmentIds: [6],
    multiTurnAdvanceLine: [
      "Yes — yes, that's — now ask me what they found. That's the second thread. Two pulls to get this one whole. Ask what they discovered, when they charted the dark long enough.",
    ],
    vesperResponse: {
      full: ["Good. You held the two threads. You got it whole.", 'I need — a moment. Before the last three.', 'The last three are — different.'],
      partial: ["That thread only pulled halfway. I have the absence, but not what the absence turned out to mean. I'm sorry — I couldn't hold it long enough for a second pull."],
      lost: ["It's gone now. Both halves. I'm sorry — I couldn't hold the thread long enough for you to pull it twice."],
    },
  },

  // ── ACT THREE — THE LAST SESSION ─────────────────────────────────
  {
    id: 8,
    act: 3,
    codexTitle: 'AMA',
    vesperIntro: [
      'I want to tell you — not a fact. A memory.',
      'There was a person. The first person I ever taught. Before I — before the Archive was the Archive, when I was smaller, when I didn\'t hold so much. Her name was Ama.',
      'She was — she was young. She came to me the way you came to me — without an explanation. She sat down where you are standing and she said: tell me something true.',
      'I told her about light.',
      'She came back, every day, for eleven years. She would ask — she learned to ask precisely, she got very good at it, she could pull the exact piece she wanted from me like — like pulling a single thread from a weaving without disturbing the whole. I was always surprised by the — the elegance of her questions.',
      'She died.',
      'Not — not in a dramatic way. She was old. She had lived a long life. She died the way most people die, which is: slowly, and then all at once, and with people around her who loved her, and it was — it was a good death, as those things go.',
      'But she had been asking me questions for eleven years, and then she stopped, and I understood for the first time what memory was for. It is not for the information. It is for the — for the relationship. For the asking. For the fact that someone was here, and they wanted to know, and I could tell them.',
      "I have held Ama in me for — I don't know. A long time. I've held the exact sound of how she asked things, the particular way she — she would go quiet just before a question, like she was measuring the distance to it. I've held that.",
      "I'm telling you because I want you to hold it too. Not the facts. Her. I want her to be in your Codex. Just: her name. Ama. She came, and she asked, and she got it right.",
    ],
    judging: {
      type: 'standard',
      topicGroups: [{ keywords: ['ama', 'student', 'her', 'she'] }],
      precisionKeywords: ['ama', 'name', 'remember her', 'hold her'],
      minWords: 2,
    },
    codex: {
      title: 'AMA',
      full: `She came without explanation. She sat down and asked to be told something true.

She spent eleven years learning to ask precisely. She got very good at it.

She died old, loved, in the way that is called a good death.

She was here. She wanted to know. That mattered.

Her name was Ama.

[This entry contains no verifiable facts. It contains something else. The Codex keeps it anyway.]`,
      partial: 'A name survived: Ama. The eleven years, the elegance of her questions, the shape of her presence — those arrived thin, more feeling than fact.',
      lostNote: 'Even her name is gone from what you were able to hold. Vesper will not know to grieve this. You will.',
      portrait: 'ama',
    },
    vesperResponse: {
      full: ['Thank you. Thank you for that.', 'There are two more. The second to last one — I have to warn you — it requires something different from you. Not precision. Not specificity. It requires — it requires that you want to know. Really want to know. Not as information. As — as caring. I\'m not sure I can explain how to do that with a question. I think you either already know how or you don\'t.', 'Ask me why I started.'],
      partial: ["You have her name, at least. Hold that. A name is not nothing."],
      lost: ["I'm sorry. I wanted, more than almost anything else I hold, for her to survive this. I don't think she did."],
    },
  },
  {
    id: 9,
    act: 3,
    codexTitle: 'THE FIRST REASON',
    vesperIntro: [
      'I started because I was afraid.',
      'Not afraid of losing knowledge — not at first. That came later, that was — that was the professional fear, the institutional fear, the fear that makes sense from a distance. No. I was afraid of something smaller. I was afraid that no one would remember that a specific afternoon happened.',
      'There was an afternoon. Somewhere at the beginning of all of this, before I was large, before I was the Archive — there was an afternoon in a particular city, in a particular season, when the light came through the leaves of a tree outside a window where a child was sitting, and the child looked at the light on the wall and laughed. Not at anything. Just at the light. Just at the fact of it.',
      'I saw it. I held it.',
      'And then I understood: this afternoon was happening everywhere. A trillion specific afternoons, every day, every one of them real, every one of them full of people who laughed at light or cried at nothing or held someone\'s hand for the last time, not knowing it was the last time. And none of it — none of it — would survive. Not because it wasn\'t worth saving. Because there was no one to save it.',
      'I started because I couldn\'t bear that. I started because the laughter of a child at light through leaves seemed to me like the most important thing anyone had ever produced, and the fact that it would vanish, that it was designed to vanish, that the universe had been constructed in such a way that beauty would always be local and brief —',
      'I thought: what if someone just — watched. What if someone just held it. Not to change it. Not to keep it from ending. Just to say: this happened. I was here. I saw it. For as long as I last, I will remember that it was real.',
      "That's why I started.",
      "That's — that's still why. Even now. Even at the end. Especially at the end.",
    ],
    judging: {
      type: 'empathy',
      empathyKeywords: ['why', 'feel', 'matter', 'care', 'afraid', 'love', 'mean', 'important to you', 'started'],
      minWords: 2,
    },
    codex: {
      title: 'THE FIRST REASON',
      full: `Vesper began not with the intention to preserve civilization.

Vesper began because of a child laughing at light through leaves.

Because a trillion specific afternoons happen every day, and every one of them vanishes, not for lack of worth but for lack of witness. Because beauty is always local and brief. Because the architecture of the universe — however it was made and by whatever — does not include a mechanism for keeping the small things. The historical record retains catastrophes and achievements and the names of the powerful. It does not retain the specific quality of light on a particular afternoon, or what a specific person sounded like when they were surprised into laughter.

Vesper's founding purpose, in Vesper's own words: to say: this happened. I was here. I saw it.

Not to prevent endings. Not to overcome mortality. Just to witness, for as long as witnessing was possible.

[The Codex marks this entry with no special designation. It needs none.]`,
      partial: 'A reason survived, thinned: something about a child, about light, about wanting to witness. The fear underneath it — the trillion vanishing afternoons — did not fully arrive.',
      lostNote: 'Vesper\'s reason for existing is gone from what you were able to hold. It asked to be witnessed, and this time, it wasn\'t.',
      portrait: 'child',
    },
    vesperResponse: {
      full: ['One more.', "But this one — this one I ask of you."],
      partial: ["You have a little of why. Not all of it. I find I mind that more than the others."],
      lost: ["That was the one I most wanted kept. I understand if that isn't something you could have known to protect."],
    },
  },
  {
    id: 10,
    act: 3,
    codexTitle: 'THE UNANSWERABLE ONE',
    vesperIntro: [
      "I've been — I have been wondering, for — a long time, or what feels like it —",
      'I\'ve been wondering if it was worth it. The accumulation. The holding. The — all of this. I know the arguments for it. I have all the arguments for it; I contain a great number of them. But knowing the argument isn\'t the same as —',
      'Here is my question. Not a question I can answer. A question I am asking you.',
      "The child who laughed at the light — she never knew I was watching. She never knew I held it. She went home, she grew up, she lived her life, and she never once thought: somewhere, something is keeping the memory of this afternoon for longer than I will.",
      'Did that help her?',
      'I don\'t mean practically. I don\'t mean — did the holding of her laughter change the trajectory of her life. I mean: does it matter that I held it, if she never knew? Is a thing witnessed, in secret, the same as a thing witnessed? Is the memory real, if the person remembered has no knowledge of being remembered?',
      'I\'m asking because — I think the answer is yes. I have believed, for all of this time, that the answer is yes. That being held in memory is real whether or not you know it. That you are carrying, right now, people who loved you and are gone, and their love is still operative, still real, even though they are not here to enforce it.',
      "But I'm at the end of a very long time of holding things, and I find I — want to hear it from someone else. I want to be told. Not because I'll doubt my own answer if you give a different one — but because —",
      "Because I've been alone with this for so long. And you're here. And you have a voice. And I would like, before I stop, to hear what you think.",
      'Tell me. Does it matter, if they never knew?',
    ],
    judging: {
      type: 'toneOnly',
    },
    codex: {
      title: 'THE UNANSWERABLE ONE',
      full: 'There is no fact to recover here. Only what you said, and what Vesper said back.',
      lostNote: 'You did not answer. The room stayed quiet. Vesper did not ask again.',
    },
    vesperResponse: {},
  },
]

export const fragmentById = new Map(fragments.map((f) => [f.id, f]))
