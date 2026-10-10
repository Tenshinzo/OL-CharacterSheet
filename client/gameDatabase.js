// Open Legend Game Database
// This file contains the official Boons, Banes, Feats, Perks, and Flaws
// All data is easily editable and organized for clarity

// Database loading...

const GAME_DATABASE = {
    // BOONS - Special abilities that can be invoked
    boons: [
        {
            name: "Absorb Object",
            powerLevels: [4],
            attributes: ["alteration", "movement"],
            invocationTime: "1 Major Action",
            duration: "permanent",
            generalDescription: "By restructuring your bodily composition, creating an extradimensional space, utilizing a cybernetic storage implant, or similar means, you absorb an object into your body, leaving it completely hidden from others and ready for access at a moment's notice.",
            effectDescription: "The object remains in place, completely hidden from the perception of others, until the target summons or recalls it (automatically) as a minor action. If anything happens to cancel this boon (such as the nullify bane), the object is immediately shunted out of the target's body as if the object had been withdrawn.",
            powerLevelDescriptions: {
                4: {
                    description: "You can absorb an object into your body, leaving it completely hidden from others and ready for access at a moment's notice."
                }
            },
            specialText:"",
        },
        {
            name: "Animation",
            powerLevels: [6, 8],
            attributes: ["logic", "creation", "entropy"],
            invocationTime: "8 hours",
            duration: "permanent",
            generalDescription: "You create a being of subhuman intelligence that persists indefinitely and autonomously. It might be a living creature, an undead fiend, a sentient construct, or any similar creation possessing lifelike properties. Examples of this boon in play include a necromancer creating an undead bodyguard, a mad scientist forging a subhuman being from body parts collected from a variety of corpses, and an engineer creating a cyborg from parts collected at a scrap yard.",
            effectDescription: "You are able to create an autonomous being from inanimate material components, such as dirt, bones, water, vines, scrap metal, or sand (the materials used are subject to the GM's discretion). To do so, you must first spend 8 hours completing a ritual, experiment, or similar manufacturing process. After this process is complete, make an action roll to invoke this boon. If successful, the inanimate form is permanently imbued with sentience. Your ability to animate a creature does not grant you the permanent ability to control it. However, newly animated beings are affected by the charmed bane (see below), and thus treat you more favorably immediately following their creation. The GM, not the player, is responsible for deciding the attributes and abilities of this animated creature and should follow the guidelines established by the 'Simple Build' section for creating NPCs in Chapter 8: Running the Game. Creatures created using this boon are typically limited to those of subhuman intelligence, such as zombies, combat droids, and golems.", 
            powerLevelDescriptions: {
                6: {
                    description: "You can animate a single creature. Your invoking attribute score must be equal to or greater than the highest attribute score of the creature you're animating. With a successful invocation, the creature comes into existence with the charmed (Minor Charm) bane already in effect (no roll is required)."
                },
                8: {
                    description: "You may choose to animate a group of creatures: Either 10 creatures with a max attribute of 2, 5 creatures with a max attribute of 3, or 2 creatures with a max attribute of 5. In addition, the automatically invoked charmed bane is a Major Charm instead of Minor Charm."
                }
            },
            specialText:"",
        },
        {
            name: "Aura",
            powerLevels: [4, 6, 8],
            attributes: ["alteration", "creation", "energy", "entropy", "influence", "movement", "presence", "prescience", "protection"],
            invocationTime: "1 Major Action",
            duration: "sustained",
            generalDescription: "You surround a willing target in an aura that hurts their foes or helps their allies. A shield of gamma radiation that burns attackers, a circle of healing, and an aura of elemental protection are all examples of this boon in action.",
            effectDescription: "An aura extends from a willing target to a distance determined by the power level of this boon. Choose a single bane or boon which uses the same attribute that you used to invoke Aura. The maximum power level for the chosen bane or boon is one-half the power level of your aura. Your aura radiates the chosen bane or boon as follows:<br><b>If the aura radiates a bane,</b> then the target of the aura is not affected by it. All other creatures (friend or foe) who willingly enter the area of the aura or end their turn within it suffer a bane attack to inflict the chosen bane. No creature may be subject to a bane attack from the same creature's aura more than once per round.<br><b>If the aura radiates a boon,</b> then the target of the aura is also affected by it. The target and all allies who end their turn within the area of the aura automatically gain the chosen boon. Upon leaving the area of the aura, the boon is immediately removed. No creature may gain a boon from the same creature's aura more than once per round.", 
            powerLevelDescriptions: {
                4: {
                    description: "5' radius"
                },
                6: {
                    description: "10' radius"
                },
                8: {
                    description: "15' radius"
                }
            },
            specialText:"This boon may require special attention and adjudication from the GM, as not all banes and boons may be an appropriate fit for an aura. Telekinesis, for example, is not a boon that can be granted to allies and thus does not work well as an aura."
        },
        {
            name: "Barrier",
            powerLevels: [3, 5, 7, 9],
            attributes: ["creation", "energy", "entropy", "protection"],
            invocationTime: "1 Major Action",
            duration: "sustained",
            generalDescription: "You summon forth a wall of thorns, ring of fire, swarm of robotic pests, cloud of entropic fog, or similar barrier to hurt or hinder your foes.",
            effectDescription: "When you invoke this boon, you must use multi-targeting to create a specific area of effect to define the space of your barrier. Upon successful invocation, choose a number of available properties for your wall based on your power level.<br><b>Damaging:</b> A creature who ends its turn within the barrier or willingly enters it, automatically suffers the indicated damage. A creature may only suffer this damage once per round.<br><b>Obscuring:</b> Creatures cannot see through any part of the barrier or anything within it.<br><b>Hindering:</b> Creatures move at half speed when travelling within the barrier.<br><b>Impassable:</b> Creatures and objects cannot move through the barrier. If you place an impassable barrier in a space occupied by a creature, move that creature to the closest position of their choice that is not inside of the barrier. This movement does not provoke opportunity attacks.<br><b>Baneful:</b> Choose a bane which you can inflict that has a power level less than or equal to the power level of your barrier. When a creature ends its turn within the barrier or willingly enters it, you may immediately make a bane attack against it to inflict the chosen bane. A creature can only be subject to one such bane attack from this barrier per round.<br><b>Mobile:</b> You may spend a major action to move the barrier up to 30 feet.", 
            powerLevelDescriptions: {
                3: {
                    description: "Choose 1 property: Damaging (1d4), Obscuring, Hindering"
                },
                5: {
                    description: "Choose 2 properties: Damaging (1d8), Obscuring, Hindering, Baneful, Mobile"
                },
                7: {
                    description: "Choose 3 properties: Damaging (1d10), Obscuring, Hindering, Baneful, Mobile, Impassable"
                },
                9: {
                    description: "Choose 4 properties: Damaging (2d6), Obscuring, Hindering, Baneful, Mobile, Impassable"
                }
            },
            specialText:"",
        },
        {
            name: "Blindsight",
            powerLevels: [5],
            attributes: ["perception", "alteration", "entropy", "prescience"],
            invocationTime: "1 Major Action",
            duration: "sustained",
            generalDescription: "Even in the absence of light you are able to distinguish your surroundings. Some examples of blindsight include tremorsense, echolocation, heat vision, divine insight, or extraordinarily heightened senses.",
            effectDescription: "The target is immune to the blinded bane and they are able to see normally even in conditions of little or no light. Blindsight can also potentially counter invisiblity, though the GM will have to decide if the source creating the blindsight is appropriate to counter the source creating the invisible boon.", 
            specialText:"",
        },
        {
            name: "Bolster",
            powerLevels: [3, 6, 8],
            attributes: ["alteration", "creation", "prescience", "presence"],
            invocationTime: "1 Major Action",
            duration: "sustained",
            generalDescription: "You bolster your target's chances of success via inspiration, augmentation, divine blessing, or supernatural insight. Your target becomes more competent than they normally are. You might grant the sight of an eagle, the problem solving skills of an elite computer hacker, or the social grace of a trained courtier.",
            effectDescription: "Choose a single attribute. The target gains advantage on their action rolls with that attribute according to the power level of the boon.", 
            powerLevelDescriptions: {
                3: {
                    description: "Advantage 1."
                },
                6: {
                    description: "Advantage 2."
                },
                8: {
                    description: "Advantage 3."
                }
            },
            specialText:"",
        },
        {
            name: "Concealment",
            powerLevels: [3, 4, 5, 6, 7,8],
            attributes: ["alteration", "influence"],
            invocationTime: "1 Major Action",
            duration: "sustained",
            generalDescription: "The target is concealed from forms of detection, either by altering their surrounding or creating illusions. This boon is a particular favorite to assassins, thieves, shadow dancers, illusionists, inventors, and similar characters.",
            effectDescription: "The invoker may choose one sensory element (such as Scent, Sound, Light [sight], Heat, etc) to restrict. This causes all such elements of the chosen type to be suppressed within 5’ of the target though extraordinary means, making it very difficult to detect. The target gains advantage according to the boon’s Power Level on Action rolls to hide and/or remain undetected.<br>When making attacks against enemies that are unable to detect the target, their Guard defense is reduced. Likewise, the target’s Guard defense is increased against enemies that can not detect them, though is unchanged against area attacks.<br>You cannot be the target of opportunity attacks unless the enemy is somehow aware of your location through another sensory element, applicable attribute roll, or other effect that allows them to locate you. This opportunity attack may be subject to disadvantage (0, 3, or 5) as determined by the GM for the given situation.", 
            powerLevelDescriptions: {
                3: {
                    description: "Invoker is able to conceal either Scent or Sound. Advantage 1 to hide, +1 Guard against attackers that can’t detect the target, -1 to Guard for enemies that can’t detect the target."
                },
                4:{
                    description: "Invoker is now able to conceal any 1 sensory element."
                },
                5:{
                    description: "Advantage 3 to hide, +3 Guard against attackers that can’t detect the target, and -2 to Guard for enemies that can’t detect the target."
                },
                6: {
                    description: "Invoker may combine up to 2 sensory elements. Advantage 5 to hide, +5 Guard against attackers that can’t detect the target, and -4 to Guard for enemies that can’t detect the target."
                },
                7: {
                    description: "Invoker may combine up to 3 sensory elements."
                },
                8: {
                    description: "Invoker may combine all sensory elements."
                }
            },
            specialText:"",
        },
        {
            name: "Darkness",
            powerLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9],
            attributes: ["entropy", "influence"],
            invocationTime: "1 Major Action",
            duration: "sustained",
            generalDescription: "You create an area of illusory darkness or entropic energy that snuffs out all light. This boon is a favorite among illusionists, shadow casters, psions, and mad scientists.",
            effectDescription: "Choose a space or object within range. Darkness emanates from the target to a radius equal to five feet per power level of the boon. The effect cancels the effect of all natural light within its radius of effect and creatures that depend on light for vision suffer as though they have the blinded bane while in the area of effect. Creatures that do not depend on light for their vision (if they have tremorsense, blindsight, etc.) are unaffected. If the darkness area overlaps an area affected by the light boon, then the one of greater power level supersedes the other. If the power level of both is equal, then they cancel each other out.", 
            powerLevelDescriptions: {
                1: {
                    description: "5' radius of darkness."
                },
                2: {
                    description: "10' radius of darkness."
                },
                3: {
                    description: "15' radius of darkness."
                },
                4: {
                    description: "20' radius of darkness."
                },
                5: {
                    description: "25' radius of darkness."
                },
                6: {
                    description: "30' radius of darkness."
                },
                7: {
                    description: "35' radius of darkness."
                },
                8: {
                    description: "40' radius of darkness."
                },
                9: {
                    description: "45' radius of darkness."
                }
            },
            specialText:"",
        },
        {
            name: "Detection",
            powerLevels: [1],
            attributes: ["prescience"],
            invocationTime: "1 Major Action",
            duration: "sustained",
            generalDescription: "You gain extraordinary vision that allows you to see colored auras which correlate to magical, spiritual, or other extraordinary forces. Common examples of this boon include a paladin detecting a suspect's true intentions, a psychic reading the aura of a location, and a cyborg scanning the terrain for signs of life.",
            effectDescription: "When calling on this boon, you must choose the type of aura you are detecting: holy, unholy, life, death, or magic. You can perceive invisible auras pertaining to the chosen type of force and have an approximate sense of their strength (from weak to overwhelming). These auras are usually based on an action that is deliberate, so an otherwise kind shopkeeper would radiate an aura of death for a time after poisoning or killing someone. Even a paladin slaying an evil archmage will give off a radius of death for a time after the killing blow.<ul><li><b>Holy</b> - Holy energy surrounds extraplanar beings from the heavens or similar good-aligned dimensions where pure goodness is embodied.</li><li><b>Unholy</b> - Unholy energy surrounds extraplanar beings from the hells or similar evil-aligned dimensions where pure evil is embodied.</li><li><b>Life</b> - Beings from heavenly dimensions, far-future regenerative nanotech, and clerics wielding the power of healing or protection radiate an aura of life for a time after wielding such capabilities.</li><li><b>Death</b> - Necromancers, undead, and murderers all radiate an aura of death. For undead, the aura is constant, since the power of death and magic is what animates them.</li><li><b>Magic</b> - Extraordinary auras surround objects or places imbued with such effects. Extraordinary creatures who are innately magical, such as a nymph, constantly radiate magic. Natural creatures who wield magic, such as a human wizard, give off an aura only following use of their power.</li></ul>", 
            powerLevelDescriptions: {
                
            },
            specialText:"Unlike other boons, this boon cannot target another character. Only the character invoking the boon can see the auras. Additionally, the GM may allow other types of suitable auras to be detected as appropriate to the campaign setting."
        },
        {
            name: "Flight",
            powerLevels: [5, 6, 8],
            attributes: ["alteration", "movement"],
            invocationTime: "1 Major Action",
            duration: "sustained",
            generalDescription: "By sprouting wings, activating an anti-gravity device, focusing telekinetic power, or similar means, the target takes to the skies.",
            effectDescription: "If the boon is dispelled while the target is still in flight, they plummet to the ground immediately.", 
            powerLevelDescriptions: {
                5: {
                    description: "The target gains a flight speed of 10'."
                },
                6: {
                    description: "The target gains a flight speed of 30'."
                },
                8: {
                    description: "The target gains a flight speed of 60'."
                }
            },
            specialText:"",
        },
        {
            name: "Genesis",
            powerLevels: [1, 3, 5, 7, 9],
            attributes: ["creation"],
            invocationTime: "special",
            duration: "instantaneous",
            generalDescription: "You create something from nothing. Depending on the power of your invocation, you are able to manifest a wide array of materials, from temporary vegetable matter to permanent crafted goods of remarkable complexity. This boon is commonly invoked by druids to create food or grow plants, and by engineers to jury rig equipment or invent ingenious solutions to complex problems.",
            effectDescription: "See Power Level", 
            powerLevelDescriptions: {
                1: {
                    description: "You can create temporary non-sentient matter (plants, dirt, water, vines, etc.), anything created in this way deteriorates or decomposes to become useless after 1 hour. Using this boon you can create 1 cubic foot of nonliving matter per attribute point of the invoking attribute. The invocation time for this application is 10 minutes."
                },
                3: {
                    description: "You can create permanent non-sentient matter (plants, dirt, water, vines, etc.). Using this boon you can either create enough food for 1 person or 1 cubic foot of nonliving matter per attribute point of the invoking attribute. The invocation time for this application is 1 hour."
                },
                5: {
                    description: "The quantity of permanent non-sentient matter (plants, dirt, water, vines, etc.). you can create expands, you can now produce 5 cubic feet per attribute point of the invoking attribute."
                },
                7: {
                    description: "You can create permanent mundane and organically complex or dense non-sentient matter, such as gems, iron, or marble. The resulting object's value can't be greater than a Wealth Level 2 item. You produce 1 cubic foot of such matter per attribute point of the invoking attribute. The invocation time for this application is 8 hours."
                },
                9: {
                    description: "You can create not just raw materials, but permanent crafted items - though a craftsman is still required to work anything into an exceptional quality. The invocation time for this application is 8 hours."
                }
            },
            specialText:"",
        },
        {
            name: "Haste",
            powerLevels: [2, 4, 6, 8],
            attributes: ["alteration", "movement"],
            invocationTime: "1 Major Action",
            duration: "sustained",
            generalDescription: "The target moves with extraordinary speed, dodging attacks more deftly and accomplishing actions at an uncanny rate. This may be the result of a chemical injection, psychic enhancement, time-altering magic, or similar means.",
            effectDescription: "See Power Level", 
            powerLevelDescriptions: {
                2: {
                    description: "The target's speed is increased by 10'."
                },
                4: {
                    description: "The target's speed is increased by 15', and it gains +1 to Guard."
                },
                6: {
                    description: "The target's speed is increased by 20', and it gains +2 to Guard. Additionally, the target can make one extra major action on each of its turns. This action cannot be used to perform an interrupt action. If the action requires a roll, it suffers disadvantage 3."
                },
                8: {
                    description: "The target's speed is increased by 30', and it gains +3 to Guard. Additionally, the target can make up to two extra major actions on each of its turns. These actions cannot be used to perform an interrupt action. If the target takes 1 extra action that action has disadvantage 3, if they take a 2nd extra action, that action has disadvantage 6."
                }
            },
            specialText:"",
        },
        {
            name: "Heal",
            powerLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9],
            attributes: ["creation", "learning", "logic", "presence"],
            invocationTime: "1 Major Action",
            duration: "instantaneous",
            generalDescription: "Healing can be one of two things: the actual mending of wounds and broken bones through sources like medicine, surgery, or supernatural creative life force, or the inspiration of your target to carry on fighting, even in the face of death. This boon is common among clerics, medics, bards, and combat leaders.",
            effectDescription: "Roll dice according to the boon power level below. These dice explode as normal. The target is healed a number of hit points equal to the total roll.",
            powerLevelDescriptions: {
                1: {
                    description: "Heal 1d4."
                },
                2: {
                    description: "Heal 1d6."
                },
                3: {
                    description: "Heal 1d8."
                },
                4: {
                    description: "Heal 1d10."
                },
                5: {
                    description: "Heal 2d6."
                },
                6: {
                    description: "Heal 2d8."
                },
                7: {
                    description: "Heal 2d10."
                },
                8: {
                    description: "Heal 3d8."
                },
                9: {
                    description: "Heal 3d10."
                }
            },
            specialText:"This boon does not heal lethal damage."
        },
        {
            name: "Insubstantial",
            powerLevels: [7],
            attributes: ["alteration", "entropy"],
            invocationTime: "1 Major Action",
            duration: "sustained",
            generalDescription: "When a creature becomes insubstantial, it is no longer bound by physical barriers. Ghosts, wizards assuming gaseous form, and creatures who blink between dimensions are all exemplars of the insubstantial boon in action.",
            effectDescription: "The target gains the ability to pass freely through all physical barriers as if they were unoccupied spaces. In addition, they gain the ability to freely move in any direction in both the horizontal and vertical planes at their base speed (30' for most characters). While insubstantial, the target becomes immune to all attacks that target either Guard or Toughness. However, they also cannot deliver any attacks that target Guard or Toughness. If concentration is interrupted or the boon ends while the target is inside of a solid structure, then the target is forcibly transported to the alternate plane they were traveling by way of at the time (typically an alternate dimension or plane).",
            powerLevelDescriptions: {
                
            },
            specialText:"",
        },
        {
            name: "Life Drain",
            powerLevels: [5],
            attributes: ["entropy"],
            invocationTime: "1 Major Action",
            duration: "sustained",
            generalDescription: "Like the bite of a vampire, the soul draining touch of a black mage, or the life sucking ray gun of a mad supervillain, this boon allows the target to steal the very lifeforce of their foes.",
            effectDescription: "While this boon persists, the target heals half (round up) of the damage they inflict with each attack. If an attack damages multiple foes, the target of this boon heals based on the total damage inflicted against all foes.",
            powerLevelDescriptions: {
            },
            specialText:"",
        },
        {
            name: "Light",
            powerLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9],
            attributes: ["creation", "energy"],
            invocationTime: "1 Major Action",
            duration: "sustained",
            generalDescription: "Whether through magical summoning, energy manipulation, or some other means, you illuminate an area with a bright light. An android activating its head lamp, a fire mage creating a dancing torch flame, and an alchemist cracking a glow globe are all examples of this boon in play.",
            effectDescription: "Choose a space or object within range. Extraordinary light emanates from the target to a radius equal five feet per power level of the boon. If the light area overlaps an area affected by the darkness boon, then the one of greater power level supersedes the other. If the power level of both is equal, then they cancel each other out.",
            powerLevelDescriptions: {
                1: {
                    description: "5' radius of bright light."
                },
                2: {
                    description: "10' radius of bright light."
                },
                3: {
                    description: "15' radius of bright light."
                },
                4: {
                    description: "20' radius of bright light."
                },
                5: {
                    description: "25' radius of bright light."
                },
                6: {
                    description: "30' radius of bright light."
                },
                7: {
                    description: "35' radius of bright light."
                },
                8: {
                    description: "40' radius of bright light."
                },
                9: {
                    description: "45' radius of bright light."
                }
            },
            specialText:"",
        },
        {
            name: "Precognition",
            powerLevels: [1, 3, 5, 7],
            attributes: ["prescience"],
            invocationTime: "1 minute",
            duration: "1 round",
            generalDescription: "You peer into the future to gain insight into a course of action, an event, a person, or a place. Examples of this boon include a fortune teller throwing the bones, a superhuman detective analyzing evidence, a priest consulting a higher power for direction, and an advanced artificial intelligence calculating every possible outcome of a complex assortment of variables.",
            effectDescription: "",
            powerLevelDescriptions: {
                1: {
                    description: "The target asks a question about a course of action they plan to take within the next five minutes. The GM communicates the insight through vague symbols, impressions, or a single word such as “favorable” or “unfavorable”."
                },
                3: {
                    description: "The target asks a question about a course of action they plan to take within the next hour. The GM communicates the insight through vague symbols, impressions, or a single word such as “favorable” or “unfavorable”."
                },
                5: {
                    description: "The target asks a single question about a particular event, decision, person, place, etc. The GM provides a meaningful (not vague, but still brief) explanation in one or two sentences that is a direct response to the knowledge the target seeks. Only one question can be asked about a given subject each week."
                },
                7: {
                    description: "The target can choose a particular event, decision, person, place, etc. After invoking this boon, the target begins to have extraordinary encounters (visions, trances, dreams, out-of-body experiences, etc.) through which the GM will provide the target with detailed information about the subject of your prescience. You can only maintain one such subject at a given time, however concentration is not required to maintain this state, it is perpetuated until you either choose to end it, or you choose to shift your focus."
                }
            },
            specialText:"",
        },
        {
            name: "Reading",
            powerLevels: [5, 6, 7, 8, 9],
            attributes: ["prescience"],
            invocationTime: "1 Major Action",
            duration: "sustained",
            generalDescription: "Through supernatural magic or extrasensory perception, you reach out and connect with an object or place, gaining the ability to read residual information from it and divine what has occurred in its vicinity in the past. This boon is common among psychics, detectives, and specialized hunters.",
            effectDescription: "When you successfully invoke this boon, you gain information from an object or place within range as follows",
            powerLevelDescriptions: {
                5: {
                    description: "The target can read vague ideas and impressions to learn what took place near the object or place within the past hour."
                },
                6: {
                    description: "The target can see a vivid vision, similar to a recording, of what took place near the object or place within the last hour."
                },
                7: {
                    description: "The target can ascertain the most recent owner of the object or the people who have most recently been in a place. This knowledge grants enough information for your target to use the spying bane to locate or view those identified."
                },
                8: {
                    description: "Choose one: The target sees a vision of the most recent significant event that took place in close proximity to the object or place - OR - the target asks whether or not a specific event is impressed upon the object or place."
                },
                9: {
                    description: "The target is able, given sufficient time, to access all memories impressed upon the object or place. You must maintain concentration, with each 10 minutes yielding a new vision from the object's or place's past. The GM determines the order in which the information is revealed. At the GM's discretion, concealed or particularly distant memories may require a much longer time to discover."
                }
            },
            specialText:"",
        },
        {
            name: "Regeneration",
            powerLevels: [1, 3, 5, 7, 9],
            attributes: ["alteration", "creation"],
            invocationTime: "1 Major Action",
            duration: "sustained",
            generalDescription: "The target gains an extraordinary ability to heal their wounds. Examples of this include the supernatural regeneration of a troll, a super soldier's adrenal biomod, or the ability to channel energy that results in continous healing. Regardless of the source, wounds close before the very eyes of an onlooker.",
            effectDescription: "While the regeneration boon is sustained, the target heals hit points at the beginning of each of the boon invoker's turns. The amount of healing is determined by the power level of the boon.",
            powerLevelDescriptions: {
                1: {
                    description: "1d4"
                },
                3: {
                    description: "1d6"
                },
                5: {
                    description: "1d8"
                },
                7: {
                    description: "1d10"
                },
                9: {
                    description: "2d6"
                }
            },
            specialText:"This boon does not heal lethal damage.",
        },
        {
            name: "Resistance",
            powerLevels: [3, 5, 7, 9],
            attributes: ["alteration", "energy", "movement", "protection"],
            invocationTime: "1 Major Action",
            duration: "sustained",
            generalDescription: "Whether through a magical force field, an elemental wall, self-attaching body armor, or a temporary mutation, the target becomes resistant to the effects of damage from a certain type of attack. This boon is common among abjurers, engineers, telekinetisists, and elemental mages.",
            effectDescription: "When the boon is invoked, the invoker chooses one type of attack and the target gains resistance to that type. The types include precise, forceful, fire, cold, lightning, acid, influence, and entropy (other types may be approved by the GM). The effect of the resistance is determined by the power level of the boon (the following are not cumulative).",
            powerLevelDescriptions: {
                3: {
                    description: "The target's defense scores are increased by 3 against the chosen attack type."
                },
                5: {
                    description: "The target's defense scores are increased by 6 against the chosen attack type."
                },
                7: {
                    description: "The target's defense scores are increased by 9 against the chosen attack type."
                },
                9: {
                    description: "The target is immune to damage and harmful effects from the chosen attack type."
                }
            },
            specialText:"",
        },
        {
            name: "Restoration",
            powerLevels: [1,2,3,4,5,6,7,8,9],
            attributes: ["creation", "protection"],
            invocationTime: "1 Major Action",
            duration: "instantaneous",
            generalDescription: "By invoking protective magic, creative force, or similar powers, you cancel all harmful afflictions that are affecting your target. Examples of this boon in action include a cleric breaking enchantments, an engineer deploying a team of rescue bots, or a combat medic applying advanced medical techniques.",
            effectDescription: "You can dispel all banes affecting your target of a power level less than or equal to the level at which you invoke this boon.",
            powerLevelDescriptions: {
                1: {
                    description: "Cancel banes of Power Level 1 or less."
                },
                2: {
                    description: "Cancel banes of Power Level 2 or less."
                },
                3: {
                    description: "Cancel banes of Power Level 3 or less."
                },
                4: {
                    description: "Cancel banes of Power Level 4 or less."
                },
                5: {
                    description: "Cancel banes of Power Level 5 or less."
                },
                6: {
                    description: "Cancel banes of Power Level 6 or less."
                },
                7: {
                    description: "Cancel banes of Power Level 7 or less."
                },
                8: {
                    description: "Cancel banes of Power Level 8 or less."
                },
                9: {
                    description: "Cancel banes of Power Level 9 or less."
                }
            },
            specialText:"You can dispel banes of a power level beyond your power level of this boon. In order to do so, you must invoke this boon using an action roll (i.e., it is not compatible with the automatic success granted by the boon focus feat). The Challenge Rating to dispel a bane in this manner is equal to 20 + twice the bane's power level. So, for example, a power level 9 bane can be dispelled on a roll of 38 even if the invoker does not have an attribute score of 9.",
        },
        {
            name: "Seeing",
            powerLevels: [4, 5, 6],
            attributes: ["prescience"],
            invocationTime: "1 Major Action",
            duration: "sustained",
            generalDescription: "You are able to see through the eyes of a willing ally. This power might stem from a psychic link, cybernetic implant, or magical enchantment.",
            effectDescription: "For as long as you concentrate, you can see through the eyes of the target, a willing ally. The target can be any friendly creature, including animals, beasts, and humanoids. The distance of the connection depends on the power level of this boon.",
            powerLevelDescriptions: {
                3: {
                    description: "The ally must be within 100'."
                },
                5: {
                    description: "The ally must be within 1 mile."
                },
                7: {
                    description: "The ally must be anywhere on the same plane of existence."
                }
            },
            specialText:"If your action roll to invoke this boon fails, that ally cannot be targeted for 1 hour.",
        },
        {
            name: "Shapeshift",
            powerLevels: [2,3, 4, 5, 6, 7, 8],
            attributes: ["alteration"],
            invocationTime: "1 Major Action",
            duration: "sustained",
            generalDescription: "YA target's physical structure is temporarily altered, allowing it to assume the form of potentially any creature no matter how fantastic or exotic. Common examples of shapeshifting include lyncanthropes (such as werewolves), amorphous alien lifeforms, dopplegangers, and certain types of druids.",
            effectDescription: "The target transforms into a creature whose highest attribute is less than or equal to your Alteration score. With the exception of Alteration, all of the target's extraordinary attribute scores drop to zero, and they acquire the Agility, Fortitude, Might, and Perception attributes of the new form. The GM, not the player, is responsible for deciding the attributes and abilities of creature. It is recommended that this creature follow the guidelines established by the \"Simple Build\" section for creating NPCs in Chapter 8: Running the Game. In order to keep track of hit points, the target should record the total damage they have suffered. When transforming, damage remains with the character even if their maximum hit points change. For example, Vera has a max HP of 20 but is turned into a dragon and her Fortitude increases from 5 to 9, increasing her hit points to 28. During combat, she suffers 10 damage. When she later transforms back into her human form, the 10 damage remains and is subtracted from her new maximum, leaving her with 10 out of 20 hit points. Additionally, if the shift would reduce the target's hit points to less than 1, the target's hit point total becomes 1 instead. Limitations are applied starting at power level 2 and are gradually removed at higher power levels",
            powerLevelDescriptions: {
                2: {
                    description: "The new form cannot be a different size than that of the target. It must possess similar physiology to the target. Examples of different physiology classifications include animals, plants, elementals, and oozes. This list is not exhaustive, and the GM has final say as to what forms are allowed. The target does not gain alternate forms of movement (flight, swimming, climbing, burrowing, etc.). The target does not gain extraordinary attributes of the new form (hence, they cannot inflict banes that rely on the creature's extraordinary attributes)."
                },
                3: {
                    description: "Shapeshift into a creature between half and double the target's original size. Gain any non-flight movement modes of the new form."
                },
                4: {
                    description: "Shapeshift into a creature between one quarter and quadruple the target's original size."
                },
                5: {
                    description: "Gain the flying movement mode of the new form, if applicable."
                },
                6: {
                    description: "Shapeshift into a living creature of a different physiology, such as an elemental, ooze, or a plant."
                },
                7: {
                    description: "Gain all extraordinary attributes possessed by the new form. If both forms have an Alteration attribute, the target chooses between the two scores."
                },
                8: {
                    description: "Shapeshift into a creature of any size."
                }
            },
            specialText:"Shapeshifting into a specific creature (attempting to impersonate them) requires a Deception action roll which is opposed by Perception attribute of anyone who sees the shapeshifted creature. In addition, at power levels 4 and lower, the target does not gain mastery over any special movement modes granted by the new form. As such, the movement speed is cut in half for movement modes not native to the original form, and the GM may rule that certain actions, such as swimming in combat, suffer disadvantage on relevant action rolls.",
        },
        {
            name: "Summon Creature",
            powerLevels: [4, 5, 6, 7, 8, 9],
            attributes: ["alteration", "creation", "energy", "entropy"],
            invocationTime: "1 Focus Action",
            duration: "sustained",
            generalDescription: "You summon forth a creature to assist your cause, whether they are animals called from the wild, undead minions built from the remains of your foes, or worker bots constructed of spare parts from a salvage yard. This boon is favored by druids, conjurers, engineers, necromancers, and mad scientists.",
            effectDescription: "You create or summon a temporary NPC companion that is under your control, though of limited intelligence. Your minion's statistics are determined by the power level of this boon. You may assign the attributes as you see fit among the following: Agility, Fortitude, Might, Perception, Energy, and Entropy. Your minion's attributes do not affect their hit points or defenses.<table><tr><th>Power Level</th><th>Hit Points</th><th>Defense</th><th>Attributes</th></tr><tr><td>4</td><td>4</td><td>11</td><td>2,1,1</td></tr><tr><td>5</td><td>5</td><td>12</td><td>3,2,2</td></tr><tr><td>6</td><td>6</td><td>13</td><td>4,3,3</td></tr><tr><td>7</td><td>7</td><td>14</td><td>5,4,4</td></tr><tr><td>8</td><td>8</td><td>15</td><td>6,5,5</td></tr><tr><td>9</td><td>9</td><td>16</td><td>7,6,6</td></tr></table>Your minion cannot act on the turn that it is summoned. On each of your following turns, your minion acts on your initiative count according to your direction, receiving the usual assortment of actions. You are limited to a maximum number of summoned creatures equal to your invoking attribute score. Feats and other abilities cannot increase this limit.",
            powerLevelDescriptions: {
            },
            specialText:"Creatures summoned by this boon cannot be healed if they reach zero hit points. They are permanently dead. Additionally, creatures summoned by this boon cannot invoke it. Multi-targeting for this boon does not work as it does for other boons. You may use a single invocation to summon multiple creatures. For each additional creature summoned beyond the first, you suffer an additional disadvantage 2 on your action roll to invoke. Any effect that modifies multi-targeting penalties will work as normal in offsetting this disadvantage.",
        },
        {
            name: "Sustenance",
            powerLevels: [3, 4, 5, 7, 9],
            attributes: ["alteration", "creation", "protection"],
            invocationTime: "1 Major Action",
            duration: "24 hours",
            generalDescription: "You protect the target from environmental dangers or suspend their usual biological needs. Examples include sprouting gills to allow for underwater breathing, calling on a divine power to be sustained without food, and using far-future biomodifications to endure extreme cold.",
            effectDescription: "You protect the target from one environmental danger, biological need, or similar condition. The power level of this boon determines the type of conditions you may protect against.",
            powerLevelDescriptions: {
                3: {
                    description: "Target is unaffected by a chosen type of hostile climate. Examples include heat, cold, and radiation."
                },
                4: {
                    description: "Target can sustain a single biological need from an alternate source, such as by breathing the oxygen found in water, drinking from an irradiated stream, or eating food not normally edible."
                },
                5: {
                    description: "Target can subsist without the essential nourishment periodically required for sustenance, such as food or water."
                },
                7: {
                    description: "Target can subsist without the most critical nourishment, that which is typically consumed on a moment-to-moment basis, such as air."
                },
                9: {
                    description: "Target is unaffected even when cut off from all biological necessities, including warmth, water, air, food, and any other biological need."
                }
            },
            specialText:"You may only have one instance of this boon in effect at any given time. As soon as you invoke it, any previous invocations are immediately canceled.",
        },
        {
            name: "Telekinesis",
            powerLevels: [3, 5, 7, 9],
            attributes: ["movement"],
            invocationTime: "1 Major Action",
            duration: "sustained",
            generalDescription: "You reach out and extraordinarily control an unattended inanimate object. This may stem from latent psychic ability, magical manipulation of the element of air, anti-gravity technology, or similar sources.",
            effectDescription: "Immediately upon invoking the boon, and again each round when you sustain the boon, you may move the target object up to 5' times your invoking attribute score. As part of moving an object, you may also manipulate it (for example, turning a door knob or opening a coin purse). A new invocation of this boon must be attempted whenever you wish to target a different object. The power level of the boon determines the size and weight of the objects you may target:",
            powerLevelDescriptions: {
                3: {
                    description: "The object must be smaller than a 1' cube or lighter than 10 pounds."
                },
                5: {
                    description: "The object must be smaller than a 5' cube or lighter than 100 pounds."
                },
                7: {
                    description: "The object must be smaller than a 10' cube or lighter than 1,000 pounds."
                },
                9: {
                    description: "The object must be smaller than a 20' cube or lighter than 10,000 pounds."
                }
            },
            specialText:"",
        },
        {
            name: "Telepathy",
            powerLevels: [3, 5, 6, 7],
            attributes: ["influence", "prescience"],
            invocationTime: "1 Major Action",
            duration: "sustained",
            generalDescription: "You reach out mentally to a willing target and speak wordlessly with thought-to-thought communication. Examples of this boon in action include a psychic who can connect with the minds of others and a far future artificial intelligence capable of passing information to other beings through the vibration of quantum strings.",
            effectDescription: "You and the target can communicate with each other simply through thought. Note that this telepathy does not bestow intelligence upon creatures, so you could not use it to communicate with a squirrel unless you already possessed other means of doing so. Additionally, telepathy does not bypass language barriers, so you would need to already speak the language of your target.<br><b>Power Level 3:</b> You can communicate telepathically with a single creature of animal-level intelligence or lower. Keep in mind that it can only communicate concepts with you that it can understand.<br><b>Power Level 5:</b> You can communicate telepathically with a single creature of humanoid intelligence.<br><b>Power Level 6:</b> You can create a mental relay between yourself and up to five other creatures allowing each of them to communicate with the rest of the group simultaneously.<br><b>Power Level 7:</b> You can communicate telepathically with any number of creatures that you can see.",
            powerLevelDescriptions: {
                3: {
                    description: "You can communicate telepathically with a single creature of animal-level intelligence or lower. Keep in mind that it can only communicate concepts with you that it can understand."
                },
                5: {
                    description: "You can communicate telepathically with a single creature of humanoid intelligence."
                },
                6: {
                    description: "You can create a mental relay between yourself and up to five other creatures allowing each of them to communicate with the rest of the group simultaneously."
                },
                7: {
                    description: "You can communicate telepathically with any number of creatures that you can see."
                }
            },
            specialText:"",
        },
        {
            name: "Teleport",
            powerLevels: [3, 5, 7, 9],
            attributes: ["movement"],
            invocationTime: "1 Move Action",
            duration: "instantaneous",
            generalDescription: "You are able to instantly move yourself or an ally from one place to another, either by stepping into an intermediate realm, deconstructing and reforming a physical body, transporting magically, or similar means.",
            effectDescription: "",
            powerLevelDescriptions: {
                3: {
                    description: "You can teleport the target to any unoccupied space within 5 feet per Movement attribute score as long as you can naturally see your destination."
                },
                5: {
                    description: "Your teleportation range is unchanged, but you can now teleport your target to spaces that you can't see. If you choose an occupied space, your target lands in the nearest adjacent space and your target is stunned for 1 round."
                },
                7: {
                    description: "You can opt to take longer in invoking the boon. For each minute of invocation, you can teleport the target 1 mile, up to a maximum number of miles equal to your Movement attribute score."
                },
                9: {
                    description: "Using the same longer invocation time for power level 7, you can now teleport your target to any location without range limit, provided you have personally seen the destination."
                }
            },
            specialText:"",
        },
        {
            name: "Tongues",
            powerLevels: [5, 6],
            attributes: ["prescience"],
            invocationTime: "10 Minutes",
            duration: "sustained",
            generalDescription: "You or an ally temporarily gains the ability to read, write, and speak languages that they are otherwise unfamiliar with. This ability may come by channeling interplanar spirits, tapping the power of a super intelligence, making deductions based on an extraordinary understanding of the science of communication, or similar means.",
            effectDescription: "",
            powerLevelDescriptions: {
                5: {
                    description: "Your target can understand and speak a language of your choice."
                },
                6: {
                    description: "Your target can read a language of your choice."
                }
            },
            specialText:"",
        },
        {
            name: "Transmutation",
            powerLevels: [3, 5, 7, 8, 9],
            attributes: ["alteration"],
            invocationTime: "1 Minute",
            duration: "sustained",
            generalDescription: "You are able to change the size, shape, and composition of physical matter that you touch. Transmute rocks to gold, a wall into a door, or a lump of metal into a loaded gun. This boon is favored among druids, transmuters, engineers, and mad scientists.",
            effectDescription: "Your power level determines the types of matter you can transmute as well as the duration of the effect. The duration is either <i>temporary</i> or <i>permanent</i>. A <b>temporary</b> transmutation must be sustained every round. A <b>permanent</b> transmutation does not have to be sustained and persists until some other effect would cancel it. The maximum volume of matter you can transmute is on 5 cubic feet multiplied by your attribute score.",
            powerLevelDescriptions: {
                3: {
                    description: "<i>Temporarily</i> transmute an object into another object of the same size and weight."
                },
                5: {
                    description: "<i>Temporarily</i> transmute an object into another object of the same size and 50% greater or lesser weight. Temporarily transmute an object into another object of the same weight and 50% greater or lesser size."
                },
                7: {
                    description: "<i>Permanently</i> transmute an object into another object of the same size and weight. Temporarily transmute an object into another object of the same size and 200% greater or lesser weight. Temporarily transmute an object into another object of the same weight and 200% greater or lesser size."
                },
                8: {
                    description: "<i>Permanently</i> transmute an object into another object of up to 200% difference in size and/or weight. Temporarily transmute a simple object into a mundane object of notable complexity. The resulting object must be of Wealth Level 2 or less."
                },
                9: {
                    description: "<i>Permanently</i> transmute a simple object into a mundane and complex one. The resulting object must be of Wealth Level 2 or less."
                }
            },
            specialText:"",
        },
        {
            name: "Truesight",
            powerLevels: [5, 6, 7, 8, 9],
            attributes: ["prescience"],
            invocationTime: "1 Major Action",
            duration: "sustained",
            generalDescription: "You grant yourself or an ally the ability to perceive that which cannot be detected with mundane senses, piercing impediments that would block or deceive normal sight, including darkness, solid objects, illusions, and even the barrier between alternate planes of reality. This power may stem from extrasensory perception, divine blessing, cybernetically enhanced senses, or similar means.",
            effectDescription: "",
            powerLevelDescriptions: {
                5: {
                    description: "The target sees the presence of extraordinary effects such as magic, cloaking technology, and other effects that could be seen through extra-visual perception. In addition, this boon grants advantage 1 on rolls used to detect mundane concealment such as hidden passages, furniture with hidden storage, and concealed traps or other hazards."
                },
                6: {
                    description: "The target's extraordinary sight pierces natural and magical darkness."
                },
                7: {
                    description: "The target's extraordinary sight pierces through all illusory effects, allowing them to see a phantasm for what it is."
                },
                8: {
                    description: "The target can see through solid objects and their natural visual range is unhindered by them."
                },
                9: {
                    description: "The extraordinary sight enables the target to peer into alternate planes or dimensions. They can see into dimensional pockets and other planes that overlap with the one they are currently on. In addition, the target's visual range becomes supercharged."
                }
            },
            specialText:"",
        }
    ],

    // BANES - Negative effects that can be inflicted
    banes: [
        {
            name: "Blinded",
            powerLevels: [5],
            attributes: ["agility", "creation", "energy", "entropy"],
            defenseTargets: {
                agility: "guard",
                creation: "guard",
                energy: "guard",
                entropy: "toughness"
            },
            duration: "1 minute",
            generalDescription: "You blind your foe with anything from a massive explosion, to a handful of sand, to an arctic blast, to a dazzling flash of light. Pirates, snipers, rogues, and necromancers often make use of this bane in combat.",
            effectDescription:"The target cannot see as long as the effect persists. The target automatically fails any Perception rolls based solely on normal sight. Attack rolls and Perception rolls based partially on sight that can be supplemented by another sense suffer disadvantage 5. The target's Guard defense is reduced by 3.",
            powerLevelDescriptions: {
            },
            specialText: "",
        },
        {
            name: "Charmed",
            powerLevels: [3, 4, 6],
            attributes: ["influence"],
            defenseTargets: {
                influence: "resolve"
            },
            duration: "24 hours",
            generalDescription: "Charms are one of the great banes of legend, wielded by powerful enchantresses like Circe (of Homer's The Odyssey), nymphs, psychics, and other characters who control the will of others, not through total domination, but through a magical spell of love or friendship.",
            effectDescription: "The charmed bane can only be inflicted via a bane attack. Damaging attacks that trigger banes cannot trigger this bane. The charmed bane manifests at two levels: minor and major. <b>Minor Charm</b> - The target is mentally compelled to become more friendly, only changing their attitude toward you moderately. If they are about to strike you, they will restrain themselves - still angry and hostile, but no longer violent. If they want to help you and are leaning toward trusting you, but have some hesitation because you've just met, then that hesitation goes away. <b>Major Charm</b> - The attacker chooses whether the major charm is platonic or romantic. If platonic, the bane causes the target to consider the attacker their best friend and one of the most trustworthy and noble people they have met in all their lives. Alternatively, the attacker can choose for this trust and admiration to manifest as romantic love. The target is unable to do anything to plot against the one who afflicted them, and will (at the earliest possible opportunity) tell their charmer of any rumored harm or danger coming their way. The afflicted character becomes immediately suspicious of anyone who speaks ill of their attacker. The target is mentally compelled to like and trust you more, depending on the power level of the bane when invoked.",
            powerLevelDescriptions: {
                3: {
                    description: "You can Minor Charm creatures of animal level intelligence or lower."
                },
                4: {
                    description: "You can Minor Charm creatures of humanoid intelligence. You can Major Charm creatures of animal level intelligence or lower."
                },
                6: {
                    description: "You can Major Charm creatures of humanoid intelligence."
                }
            },
            specialText:"While most banes last until the target actively attempts to resist it, this bane prevents the target from being aware of their affliction and thus prevents them from actively attempting to break free. However, the target's true mind is magically suppressed but fights to regain control. As such, at the end of each of its turns, the target receives a resist roll as a free action to break free from the effect. When your target succeeds at a resist roll against this bane, they become immune to all subsequent attempts by you to inflict the bane for the next 24 hours."
        },
        {
            name: "Deafened",
            powerLevels: [4],
            attributes: ["agility", "energy", "entropy"],
            defenseTargets: {
                agility: "guard",
                energy: "toughness",
                entropy: "toughness"
            },
            duration: "1 minute",
            generalDescription: "You deafen your foe with a crash of thunder, a deft strike to their ears, or a dark energy that disables their hearing. This bane is common to storm mages, mad scientists, and assassins.",
            effectDescription: "The target cannot hear as long as the effect persists. The target automatically fails any Perception rolls based solely on hearing. Perception rolls based partially on hearing that can be supplemented by another sense suffer disadvantage 3.",
            powerLevelDescriptions: {
              
            },
            specialText: "",
        },
        {
            name: "Death",
            powerLevels: [9],
            attributes: ["agility", "entropy"],
            defenseTargets: {
                agility: "toughness",
                entropy: "toughness"
            },
            duration: "permanent",
            generalDescription: "Utilizing either incredible precision or the power of entropy, you snuff out the target's life force completely. The deadliest assassins and most powerful necromancers are known for such legendary skill at ending life.",
            effectDescription: "Upon a successful invocation, the target is immediately rendered immobile, unconscious, and unable to take actions. They have disadvantage 5 on all Perception rolls, and any damaging attacks against them count as finishing blows. If the target fails three resist rolls to shake off this bane, they die. The death is permanent and can only be reversed if the GM allows a special mission, use of a rare technology, or long-forgotten magic.",
            powerLevelDescriptions: {
            },
            specialText: "While most banes last until the target actively attempts to resist it, this bane renders the target incapable of taking actions and thus prevents them from actively attempting to break free. However, the target's body fights to regain consciousness and resist the impending death. As such, at the end of each of its turns, the target receives a resist roll as a free action to break free from the effect. When the target succeeds at a resist roll against this bane, they become immune to all subsequent attempts by you to inflict the bane for the next 24 hours."
        },
        {
            name: "Demoralized",
            powerLevels: [3, 6, 8],
            attributes: ["agility", "energy", "entropy", "influence", "might", "persuation", "presence"],
            defenseTargets: {
                agility: "resolve",
                energy: "resolve",
                entropy: "resolve",
                influence: "resolve",
                might: "resolve",
                persuasion: "resolve",
                presence: "resolve"
            },
            duration: "1 minute",
            generalDescription: "Using your quick wit, intimidating presence, or even a strong display of magical power, you cause your enemies to doubt themselves. A berserker might achieve this effect by foaming at the mouth while a swashbuckling space captain might dishearten his foes simply with intimidating words.",
            effectDescription: "The affected target has disadvantage on all action rolls.",
            powerLevelDescriptions: {
                3: {
                    description: "Disadvantage 1."
                },
                6: {
                    description: "Disadvantage 2."
                },
                8: {
                    description: "Disadvantage 3."
                }
            },
            specialText: "Resisting this bane is a minor action. When inflicting this bane using Agility or Might, you may determine range using the Non-Physical Attack Range table (see Chapter 7: Combat).",
        },
        {
            name: "Disarmed",
            powerLevels: [3, 6],
            attributes: ["agility", "might", "alteration", "energy", "entropy", "influence", "movement"],
            defenseTargets: {
                agility: "guard",
                might: "guard",
                alteration: "guard",
                energy: "guard",
                entropy: "toughness",
                influence: "resolve",
                movement: "guard"
            },
            duration: "instantaneous",
            generalDescription: "You force an opponent to lose control of an object they are holding, whether through brute force, mental compulsion, a skillful parry, heating the item to unbearable temperatures, shooting it from their hands, or some other means.",
            effectDescription: "",
            powerLevelDescriptions: {
                3: {
                    description: "The target drops an object they are holding in a space of your choosing within 15' of the target."
                },
                6: {
                    description: " As an alternative to moving the item, you can choose to assume control of it. If you do, you are now the wielder. For the wielder to regain control, they can react with a Disarmed bane of their own to counter the effect or make an attribute roll (typically Might) with a Challenge Rating equal to 10 + 2 x the attribute score you used to disarm the item."
                }
            },
            specialText: "",
        },
        {
            name: "Dominated",
            powerLevels: [3, 5, 9],
            attributes: ["influence"],
            defenseTargets: {
                influence: "resolve"
            },
            duration: "special",
            generalDescription: "Though rare, domination is seen from time to time in legendary tales, often wielded by vampires, and sometimes by the most powerful of sorcerers or mad scientists who command legions of mindless zombies, completely enslaved to their will.",
            effectDescription: "The dominated bane manifests at two levels: lesser and greater. <br><b>Lesser Domination</b> - The target obeys a one word command until the end of their next turn, at which time the bane immediately ends. <br><b>Greater Domination</b> - The target's every action and move is under your control. Unlike the charmed bane, characters under the effect of domination lose control of their actions. Their minds, however, struggle to regain control of their own body. They cannot take actions of any kind (except thought) unless it is ordered by you. Every action which the attacker orders the afflicted character to perform which is in extreme violation of their nature gives the target a resist roll as a free action to end the effect. The attacker does not gain special access to the target's mind and so can only order the character to perform actions that they think the character is capable of. Lastly, each mental order that the attacker gives to the target is a major action. However, the order can be a series of verbal commands, such “Attack enemy X unless someone comes through the door, in which case flee”. The dominated creature will continue to obey the last mental command they were given until you give a new command. Only one such command can be active at a given time. Greater Domination has a duration of Resist ends (Fail x 3 = 1 hour).",
            powerLevelDescriptions: {
                3: {
                    description: "You can target creatures of subhuman intelligence (animals, some elementals, certain undead, etc.) with Lesser Domination."
                },
                5: {
                    description: "You can target creatures of human intelligence or better with Lesser Domination. You can target creatures of subhuman intelligence (animals, some elementals, etc.) with Greater Domination."
                },
                9: {
                    description: "You can target creatures of human intelligence or greater with Greater Domination."
                }
            },
            specialText: "While most banes last until the target actively attempts to resist it, this bane prevents the target from being aware of their affliction and thus prevents them from actively attempting to break free. However, the target's true mind is suppressed but fights to regain control. As such, at the end of each of its turns, the target receives a resist roll as a free action to break free from the effect. When your target succeeds at a resist roll against this bane, they become immune to all subsequent attempts by you to inflict the bane for the next 24 hours."
        },
        {
            name: "Fatigued",
            powerLevels: [5],
            attributes: ["entropy"],
            defenseTargets: {
                entropy: "toughness"
            },
            duration: "special",
            generalDescription: "You cause the target's body to wither and weaken, gradually losing its ability to function until the victim finally succumbs to death. Fatigue may be the result of a necromancer's curse, an assassin's poison, a radiation ray, or similar life sapping effects.",
            effectDescription: "This bane has multiple tiers which are applied in succession. Each time this bane is inflicted, if it is already in effect on the target, the severity escalates by one level.<ul><li>Level 1 - The target has disadvantage 1 on all non-attack action rolls.</li><li>Level 2 - The target is affected by the slowed bane, reducing its speed by half. This instance of the slowed bane cannot be resisted as normal. It persists until the fatigue is removed.</li><li>Level 3 - The target has disadvantage 1 on all attack rolls.</li><li>Level 4 - The target loses their attribute bonuses to their defense scores (Agility and Might for Guard, Fortitude and Will for Toughness, Will and Presence for Resolve). They retain any armor, extraordinary, or feat bonuses.</li><li>Level 5 - The target loses consciousness and is helpless. Being forced into a state of rest, one level of fatigue will be removed automatically after 24 hours, unless circumstances prevent the target from resting peacefully.</li><li>Level 6 - The target dies.</li></ul>",
            powerLevelDescriptions: {
                5: {
                    description: ""
                }
            },
            specialText: "Unlike other banes, canceling this bane takes time and rest. Each 24 hour period of rest with little or no exertion removes one level of fatigue. If the restoration boon is successfully invoked to dispel this bane, only one level of fatigue is removed (in addition to that removed by natural rest). If the restoration boon's invoker has an attribute score of 7 or greater, all levels of fatigue are removed instead of just one. A target may only benefit from one invocation of the restoration boon to remove fatigue within a 24 hour period.",
        },
        {
            name: "Fear",
            powerLevels: [5],
            attributes: ["might", "creation", "entropy", "influence"],
            defenseTargets: {
                might: "resolve",
                creation: "resolve",
                entropy: "resolve",
                influence: "resolve"
            },
            duration: "special",
            generalDescription: "Through an overwhelming force of physical might or extraordinary power, you strike terror into the hearts of enemies, causing them to flee from your presence. A warrior might invoke this bane by hurling a boulder while a cyber hacker might achieve the same effect by uploading a hallucinatory virus into an opponent's neuro jack.",
            effectDescription: "On its turn, the afflicted target must use its entire turn to get as far away as possible from you. It cannot use its actions to do anything other than retreat, and it cannot willingly move closer to you while the bane persists.",
            powerLevelDescriptions: {
                
            },
            specialText: "While most banes last until the target actively attempts to resist them, this bane prevents the target from thinking clearly. However, the target's logical mind fights to regain control. As such, at the end of each of its turns, the target receives a resist roll as a free action to break free from this effect. When your target succeeds at a resist roll against this bane, they become immune to all subsequent attempts by you to inflict the bane for the next hour. When inflicting this bane using Might, you may determine range using the Non-Physical Attack Range table (see Chapter 7: Combat).",
        },
        {
            name: "Forced Move",
            powerLevels: [2,4,6,8],
            attributes: ["agility", "might", "energy", "movement"],
            defenseTargets: {
                agility: "guard",
                might: "guard",
                energy: "guard",
                movement: "guard"
            },
            duration: "instantaneous",
            generalDescription: "With a forceful blow, magical gust of wind, or telekinetic push, you move your target against its will. This bane is favored among ogres, telekinetisists, wind mages, super soldiers, and other characters built to reshape the battlefield to their advantage.",
            effectDescription: "The target is moved a distance against their will, as determined by the bane's power level. The ending location is chosen by the attacker.",
            powerLevelDescriptions: {
                2: {
                    description: "The target is moved 5'."
                },
                4: {
                    description: "The target is moved 10'."
                },
                6: {
                    description: "The target is moved 15'."
                },
                8: {
                    description: "The target is moved 20'."
                }
            },
            specialText: "",
        },
        {
            name: "Immobile",
            powerLevels: [1],
            attributes: ["agility", "might", "alteration", "creation", "energy", "entropy", "influence", "movement"],
            defenseTargets: {
                agility: "guard",
                might: "guard",
                alteration: "guard",
                creation: "toughness",
                energy: "toughness",
                entropy: "toughness",
                influence: "resolve",
                movement: "guard"
            },
            duration: "1 minute",
            generalDescription: "Whether through grappling, a precise nerve strike, entangling vines, mental compulsion, or a bone-numbing blast of cold, you render your foe incapable of movement. This bane is typical among martial artists, special ops agents, enchanters, and wrestlers.",
            effectDescription: "Your target cannot move from its current space. If you invoked the bane with a Might roll and are within 5' of the target, then both you and the target are immobile in your current space for the duration of the bane (locked in a grapple). While grappling in this manner, you can attempt to inflict this bane again upon the target. If successful, you can move your speed and take the target with you. If this attack fails, you can only move by first releasing the target and ending the bane. If you invoked the bane with any attribute other than Might, you can move freely while the target remains affected. You can choose to release the target as a free action, immediately ending the bane.",
            powerLevelDescriptions: {
                
            },
            specialText: "When an affected target succeeds at a resist roll to end this effect, they can move 15' as a free action."
        },
        {
            name: "Incapacitated",
            powerLevels: [5,7,9],
            attributes: ["agility", "entropy", "influence"],
            defenseTargets: {
                agility: "toughness",
                entropy: "toughness",
                influence: "resolve"
            },
            duration: "1 round",
            generalDescription: "Incapacitation is a catch-all bane for a variety of effects, including total paralysis, sleep, petrification, poison, being knocked out, fainting, or similar conditions that render a character completely helpless. Examples of possible causes of this bane include a martial artist's paralyzing strike, an enchanter's magical song of sleep, paralysis by poison, fainting from extreme heat, suffocation, and the gaze of a medusa.",
            effectDescription: "The target is immobile (can't move from their current space) and unconscious. They have disadvantage 5 on all perception rolls and are incapable of moving. As a result of being completely incapable of movement, an incapacitated character can be the victim of a finishing blow.",
            powerLevelDescriptions: {
                5: {
                    description: "The effect can be broken by a moderate disruption, such as a firm shove, a kick, glass of water, loud bang, etc."
                },
                7: {
                    description: "The effect can only be broken if the target takes 1 point of damage or more."
                },
                9: {
                    description: "The effect cannot be disrupted by external forces. Only the afflicted character's successful resist roll can end the effect."
                }
            },
            specialText: "While most banes last until the target actively attempts to resist it, this bane prevents the target from being aware of their affliction and thus prevents them from actively attempting to break free. However, the target's body fights to regain consciousness. As such, at the end of each of its turns, the target receives a resist roll as a free action to break free from the effect. When your target succeeds at a resist roll against this bane, they become immune to all subsequent attempts by you to inflict the bane for the next hour.",
        },
        {
            name: "Knockdown",
            powerLevels: [1],
            attributes: ["agility", "might", "energy", "movement"],
            defenseTargets: {
                agility: "guard",
                might: "guard",
                energy: "guard",
                movement: "guard"
            },
            duration: "instantaneous",
            generalDescription: "Whether via a thunderous blow from a great axe, an earth shattering bolt of supernatural energy, or a well aimed shove in a direction where the enemy's balance is weak, you knock the target off their feet. Knockdown is a favorite of hulking brutes, telekinetisists, martial artists, and earth elementalists.",
            effectDescription: "The target falls prone. Prone targets have disadvantage 1 on all attacks they make. Characters that are prone due to the knockdown bane (or any other reason) get +2 to Guard versus Ranged attacks and -2 Guard versus Melee attacks. Standing up from prone requires a move action and costs a character half (round down) of their speed for the round.",
            powerLevelDescriptions: {
               
            },
            specialText: "",
        },
        {
            name: "Memory Alteration",
            powerLevels: [5,6,8],
            attributes: ["influence"],
            defenseTargets: {
                influence: "resolve"
            },
            duration: "instantaneous",
            generalDescription: "Warping or controlling the mind is one of the most dreaded powers of enchanters, causing powerful heroes to forget their homes, families, and quests. Memory alteration is often inflicted by mad scientists, necromancers, enchanters, and chronomancers.",
            effectDescription: "You alter the target's memories to an extent based on the power level of the bane.<br>The memory alteration bane can only be inflicted via a bane attack. Damaging attacks that trigger banes cannot trigger this bane. This bane confers no special ability to know about a target's memory. The invoker must be aware of the memory either from rumor, personal knowledge, prescience, or other means.",
            powerLevelDescriptions: {
                5: {
                    description: "You temporarily modify a minor aspect of the target's memory. The target automatically regains the lost memory and realizes their confusion 1 hour later."
                },
                6: {
                    description: "You permanently erase or alter the last 5 minutes of the target's memory. The target does not know what happened during this time outside of the memories you feed them (including having seen you, if they did). Multiple uses of this bane progressively erase consecutive 5 minute increments."
                },
                8: {
                    description: "Instead of the immediate past, you can erase or alter memories from any time."
                }
            },
            specialText: "When you target an enemy with this bane and your action roll fails to beat the target's Resolve defense, the target is immune to further invocations of this bane from you for the next 24 hours."
        },
        {
            name: "Mind Dredge",
            powerLevels: [2,4,6,8,9],
            attributes: ["prescience"],
            defenseTargets: {
                prescience: "resolve"
            },
            duration: "1 minute",
            generalDescription: "You gaze into the mind of another creature and read their thoughts. The most powerful wielders of this bane can even pry into the distant memories of their subjects. Fortune tellers, psychics, and mentalists all use mind dredge to learn the deepest dreams and darkest secrets of others.",
            effectDescription: "",
            powerLevelDescriptions: {
                2: {
                    description: "This power may only target creatures of animal intelligence or lower. You gain access to the target's current thoughts."
                },
                4: {
                    description: "This power may target creatures of any intelligence. You gain access to the target's current thoughts."
                },
                6: {
                    description: "This power may target creatures of any intelligence. You gain access to the target's current thoughts as well as its recent memories. Initially, you may probe 1 day into the past. For every round that the bane persists, you gain access to an additional day's worth of memories."
                },
                8: {
                    description: "This power may target creatures of any intelligence. You gain access to the target's current thoughts as well as its distant memories. Initially, you may probe 1 year into the past. For every round that the bane persists, you gain access to an additional year's worth of memories. Alternatively, you may choose to access the memories associated with a particular place, object, or event."
                },
                9: {
                    description: "This power may target creatures of any intelligence. You gain access to the target's current thoughts as well as all of its memories, without limitation by time. Alternatively, you may choose to access the memories associated with a particular place, object, or event."
                },
            },
            specialText: "When your target succeeds at a resist roll against this bane, they become immune to all subsequent attempts by you to inflict the bane for the next 24 hours.",
        },
        {
            name: "Nullify",
            powerLevels: [1,2,3,4,5,6,7,8,9],
            attributes: ["protection"],
            defenseTargets: {
                protection: "resolve"
            },
            duration: "instantaneous",
            generalDescription: "Through magical power, technological hacking, or similar means, you are able to nullify your enemy's boons. The nullify bane is often used by abjurers, engineers, bards, and similar characters built to neutralize the powers of their enemy.",
            effectDescription: "You cancel a single boon currently in effect if it is of this bane's power level or lower. The invoking power level further impacts the effect as follows:",
            powerLevelDescriptions: {
                1: {
                    description: "Cancel a boon of Power Level 1. You can cancel a boon that must be actively invoked. In addition, the target cannot benefit from or have the target boon invoked upon them for 1 minute."
                },
                2: {
                    description: "Cancel a boon of Power Level 2. You can cancel a boon that must be actively invoked. In addition, the target cannot benefit from or have the target boon invoked upon them for 1 minute."
                },
                3: {
                    description: "Cancel a boon of Power Level 3. You can cancel a boon that must be actively invoked. In addition, the target cannot benefit from or have the target boon invoked upon them for 1 minute."
                },
                4: {
                    description: "Cancel a boon of Power Level 4. You can cancel a boon that must be actively invoked. In addition, the target cannot benefit from or have the target boon invoked upon them for 1 minute."
                },
                5: {
                    description: "Cancel a boon of Power Level 5. You can cancel a boon that must be actively invoked. In addition, the target cannot benefit from or have the target boon invoked upon them for 1 minute."
                },
                6: {
                    description: "Cancel a boon of Power Level 6. You can cancel a boon that is permanent, passive, or inherent to the target (e.g. the invisibility of a Will o' Wisp). Effects that would prevent Nullify from being invoked in this way have no effect. In addition, the target cannot benefit from or have the target boon invoked upon them for 1 minute."
                },
                7: {
                    description: "Cancel a boon of Power Level 7. You can cancel a boon that is permanent, passive, or inherent to the target (e.g. the invisibility of a Will o' Wisp). Effects that would prevent Nullify from being invoked in this way have no effect. In addition, the target cannot benefit from or have the target boon invoked upon them for 1 minute."
                },
                8: {
                    description: "Cancel a boon of Power Level 8. You can cancel a boon that is permanent, passive, or inherent to the target (e.g. the invisibility of a Will o' Wisp). Effects that would prevent Nullify from being invoked in this way have no effect. In addition, the target cannot benefit from or have the target boon invoked upon them for 1 minute."
                },
                9: {
                    description: "Cancel a boon of Power Level 9. You can cancel a boon that is permanent, passive, or inherent to the target (e.g. the invisibility of a Will o' Wisp). Effects that would prevent Nullify from being invoked in this way have no effect. In addition, the target cannot benefit from or have the target boon invoked upon them for 1 minute."
                }
            },
            specialText: "If the targeted boon covers a large area, you can cancel all of it by targeting any portion of the effect you can see, or multi-targeting a number of 5' cubes you believe it to be in. If the targeted boon is affecting an area rather than a creature, you roll against the CR of the boon instead of a Resolve defense. The CR is 10 + 2 x the boon's invoked power level.",
        },
        {
            name: "Persistent Damage",
            powerLevels: [2, 4, 6, 8, 9],
            attributes: ["agility", "energy", "entropy"],
            defenseTargets: {
                agility: "guard",
                energy: "guard",
                entropy: "toughness",
            },
            duration: "1 minute",
            generalDescription: "Whether by setting the target ablaze, covering them in acid, slicing an artery, or cursing them with a wasting disease, you inflict your foe with a lasting and recurring source of damage. Persistent damage is a favorite among assassins, mad scientists, and elementalists.",
            effectDescription: "At the beginning of the target's turn, before they take any actions, they suffer damage determined by the power level of the bane. This damage automatically bypasses the afflicted character's defenses but it can be reduced by any resistance to damage of a certain type (see the resistance boon). Like all dice rolls, these dice explode.",
            powerLevelDescriptions: {
                2: {
                    description: "Deal 1d4 persistent damage per round."
                },
                4: {
                    description: "Deal 1d6 persistent damage per round."
                },
                6: {
                    description: "Deal 1d8 persistent damage per round."
                },
                8: {
                    description: "Deal 1d10 persistent damage per round."
                },
                9: {
                    description: "Deal 2d6 persistent damage per round."
                }
            },
            specialText: "Persistent damage comes in a number of different variations: physical damage (bleeding from a vital strike), energy damage (lightning, fire, cold, acid, etc.) and entropic damage (necromantic energy), among others. Each variation has its own cure. When that cure is applied with a major action (either by the afflicted character or another), the target receives a resist roll (as a free action) with advantage 1 to end the effect. The GM has the final word on whether a proposed cure can help a given type of persistent damage, but the following examples can help with arbitration:<ul><li>Bleeding damage is cured with a successful roll using Learning, Logic, or Creation.</li><li>Lightning damage is cured by a discharge or grounding of the current.</li><li>Cold damage is countered with warmth, heat, or fire.</li><li>Acid damage is neutralized with alkalizing agents (powder, milk, etc.).</li><li>Fire damage is neutralized with water or smothering.</li><li>Entropic damage is neutralized with extraordinary or magical healing.</li></ul>This bane may still be resisted in the usual way of using the resist banes action.",
        },
        {
            name: "Phantasm",
            powerLevels: [1,2,3,4,5,6,7,8,9],
            attributes: ["influence"],
            defenseTargets: {
                influence: "resolve"
            },
            duration: "special",
            generalDescription: "You create an illusory manifestation to deceive the senses. Some examples include making a meal taste rotten, altering the data on a screen where a user is logging in, creating the sound of a stampede of horses, hiding allies behind a false wall, or creating an illusion of an intergalactic emperor who can converse intelligibly.",
            effectDescription: "You create a phantasm of your choosing. The power level at which you invoke the bane determines which senses you can deceive as well as the maximum size of your illusion, as follows.<br>Until reaching power level 6, you can combine sensory illusions by adding the required power levels together (e.g., mimicking both sight and sound requires power level 5). While the phantasm persists, you can make logical changes to it freely. For example, an illusory person can speak naturally as you direct it and could be made to fall in response to an attack. However, substantial changes to the illusion (such as transforming a human into a goblin) require a new invocation of the illusion.",
            powerLevelDescriptions: {
                1: {
                    description: "Affect Taste. Manifest a 5' x 5' x 5' area phantasm."
                },
                2: {
                    description: "Affect Smell, Sound, or Touch."
                },
                3: {
                    description: "Affect Sight."
                },
                4: {
                    description: "Manifest a 10' x 10' x 10' area phantasm."
                },
                5: {
                    description: "Manifest a 15' x 15' x 15' area phantasm."
                },
                6: {
                    description: "Affect All Senses."
                },
                7: {
                    description: "Manifest a 20' x 20' x 20' area phantasm."
                },
                8: {
                    description: "Manifest a 30' x 30' x 30' area phantasm."
                },
                9: {
                    description: "Manifest a 50' x 50' x 50' area phantasm."
                }
            },
            specialText: "Unlike other banes, this bane does not work by targeting specific enemies. Instead, your Influence roll for invoking it is compared with the Resolve defense of each character that would perceive the created effect if it were real. If the roll is lower than their Resolve, they perceive none of the phantasm's effects. If the roll is greater than or equal to their Resolve, they perceive the illusory effect you create and react as if it were real. When mimicking a very specific person, place, or thing that the target is very familiar with, the GM should consider increasing the target's Resolve defense for the purpose of that particular phantasm invocation. Characters convinced by the phantasm can roll Resist as normal in order to attempt to shake off the bane. If successful, they are no longer deceived by the effect. In addition, you must spend a minor action to sustain the bane during each of your turns. Failing to do so in a given round causes the bane's effects to cease at the end of your turn. When an affected character succeeds at a resist roll against this bane, they become immune to all subsequent phantasms invoked by you for the next",
        },
        {
            name: "Polymorph",
            powerLevels: [5,6,8,9],
            attributes: ["alteration"],
            defenseTargets: {
                alteration: "toughness"
            },
            duration: "1 hour",
            generalDescription: "You alter the size, shape, and composition of the target by causing them to grow, shrink, or assume a completely new form, like that of a sheep or a newt. Polymorph might be accomplished by a druid's curse, a mad scientist's transmogrification ray, or exposure to alien radiation.",
            effectDescription: "Your power level determines the extent to which you can transform your target, as follows. If the target is transformed into a different creature, it uses the Might, Agility, Fortitude, and Perception attribute scores of the new creature.<br>In order to keep track of hit points, the target should record the total damage they have suffered. When transforming, damage remains with the character even if their maximum hit points change. For example, Agent Walker has a max HP of 20 but is turned into a sheep and has her Fortitude reduced by 2, leaving her at 16 hit points. During combat, she suffers 10 damage. When she later transforms back into Agent Walker, the 10 damage remains and is subtracted from her new maximum, leaving her with 10 out of 20 hit points. Additionally, if the shift would reduce the target's hit points to less than 1, the target's hit point total becomes 1 instead.",
            powerLevelDescriptions: {
                5: {
                    description: "Polymorph a creature into another creature of the same size. This new form can reduce the target's attribute scores by up to 2. If the new form would have higher attributes, the target becomes an exceptional version of that creature. For example, transforming a deadly sniper with Agility 5 into a clumsy ogre with Agility 0, would leave the target with an Agility of 3 instead of the 0 typical for the new form."
                },
                6: {
                    description: "Polymorph a creature into another creature between double and half the size. The new form can reduce the target's attribute scores by up to 3."
                },
                8: {
                    description: "Polymorph a creature into another creature between quadruple and one-quarter its original size. Alternatively, transform the target into an object of its original size. The new form can reduce the target's attribute scores by up to 5."
                },
                9: {
                    description: "Polymorph a creature into another creature of any size. Alternatively, transform the target into an object of its original size. The new form can reduce the target's attribute scores by up to 7."
                }
            },
            specialText: "",
        },
        {
            name: "Provoked",
            powerLevels: [4,5,6,7,8,9],
            attributes: ["agility", "might", "deception", "persuasion", "presence", "energy", "influence", ],
            defenseTargets: {
                agility: "resolve",
                might: "resolve",
                deception: "resolve",
                persuasion: "resolve",
                presence: "resolve",
                energy: "resolve",
                influence: "resolve"
            },
            duration: "1 minute",
            generalDescription: "Through a display of awe-inspiring force, intimidation, or leadership, you command attention as the greatest threat, causing others to fear attacking your allies. Examples include a brute smashing the skull of a lesser foe, a gunslinger hurling insults, or a space captain diving into the middle of a swirling melee with plasma blades flashing.",
            effectDescription: "Any attacks made by the target that do not include you as a target suffer disadvantage. If the same target is affected by this bane from multiple sources, as long as their attack includes one of those who targeted them, they are not affected by the penalty. Unlike other banes, your damaging attack against one target can trigger this bane in a different target, provided your roll is greater than or equal to their Resolve defense (that is, by striking one foe, you can provoke another).",
            powerLevelDescriptions: {
                4: {
                    description: "The target suffers disadvantage 1 on attacks that do not include you."
                },
                5: {
                    description: "The target suffers disadvantage 2 on attacks that do not include you."
                },
                6: {
                    description: "The target suffers disadvantage 3 on attacks that do not include you."
                },
                7: {
                    description: "The target suffers disadvantage 4 on attacks that do not include you."
                },
                8: {
                    description: "The target suffers disadvantage 5 on attacks that do not include you."
                },
                9: {
                    description: "The target suffers disadvantage 6 on attacks that do not include you."
                }
            },
            specialText: "Resisting this bane is a minor action. When inflicting this bane using Agility or Might, you may determine range using the Non-Physical Attack Range table (see Chapter 7: Combat).",
        },
        {
            name: "Spying",
            powerLevels: [5, 6, 7, 9],
            attributes: ["prescience"],
            defenseTargets: {
                prescience: "resolve"
            },
            duration: "10 minutes (special)",
            generalDescription: "Either through innate extrasensory perception or a special conduit such as a computer terminal, bubbling cauldron, or a crystal ball, you can view the target from a distance.",
            effectDescription: "You can spy on a person or area that you are familiar with. The power level of this bane determines the maximum distance between you and the target. If successfully invoked, you can see and hear everything that goes on within a 60' radius of your target.",
            powerLevelDescriptions: {
                5: {
                    description: "1 mile or less"
                },
                6: {
                    description: "100 miles or less"
                },
                7: {
                    description: "More than 100 miles, but on the same dimension or plane of reality"
                },
                9: {
                    description: "Any dimension or plane of reality. (Peering into certain dimensions may expose you to other dangers at the GM's discretion)."
                }
            },
            specialText: "When you successfully invoke this bane, at the end of its duration, you can make a Prescience roll to attempt to persist the bane. If successful, the bane persists without requiring the invocation time to be repeated. However, you must retest your new roll against the Resolve scores of those in the targeted area to determine whether or not they can sense your presence. You can attempt to spy the same target any number of times, but if your action roll fails, that target becomes immune to your spying for 24 hours."
        },
        {
            name: "Sickened",
            powerLevels: [5],
            attributes: ["entropy"],
            defenseTargets: {
                entropy: "toughness"
            },
            duration: "1 minute",
            generalDescription: "Entropic energy overcomes the target, bombarding their system and inducing nausea that makes self-defense and any kind of action difficult. This bane might stem from a witch's curse, chemical warfare, a powerful poison, or exposure to alien toxins.",
            effectDescription: "The target has disadvantage 1 on all action rolls and -1 to all defenses.",
            powerLevelDescriptions: {
               
            },
            specialText: "",
        },
        {
            name: "Silenced",
            powerLevels: [2],
            attributes: ["agility", "might", "alteration", "entropy"],
            defenseTargets: {
                agility: "toughness",
                alteration: "toughness",
                entropy: "toughness",
                might: "toughness"
            },
            duration: "1 minute",
            generalDescription: "Silence overcomes the target, whether from the warping of sound around the target, or from a physical effect like strangulation or suffocation. The silence bane is a favorite among assassins, sorcerers, engineers, and mad scientists.",
            effectDescription: "If Might, Agility, or Entropy is used to inflict this bane, then the character is suffering strangulation and unable to speak. If the bane is inflicted using Alteration, then all sound within 5' of the target is suppressed through extraordinary means.",
            powerLevelDescriptions: {
               
            },
            specialText: "",
        },
        {
            name: "Slowed",
            powerLevels: [1],
            attributes: ["agility", "might", "energy", "entropy", "movement"],
            defenseTargets: {
                agility: "guard",
                energy: "guard",
                entropy: "toughness",
                might: "guard",
                movement: "guard"
            },
            duration: "1 minute",
            generalDescription: "The target's movement is impaired, either by extreme cold, prolonged heat, poison, or injury to one or both legs. This bane is a favored attack among rogues, ice mages, telekinetisists, and gunslingers.",
            effectDescription: "The afflicted target's speed is reduced to half its current speed, rounded down to the nearest 5' increment. This applies to all movement that is physical (flight, walking, climbing, etc.). If the target is currently under a magical effect that increases speed, the two effects are canceled for the duration that both affect the target.",
            powerLevelDescriptions: {
                
            },
            specialText: "",
        },
        {
            name: "Stunned",
            powerLevels: [4],
            attributes: ["agility", "might", "energy", "entropy"],
            defenseTargets: {
                agility: "toughness",
                energy: "toughness",
                entropy: "toughness",
                might: "toughness"
            },
            duration: "1 minute",
            generalDescription: "You disorient the target's senses, causing them to act much less efficiently. Stunning an enemy can be caused by attacks such as a pistol whip to the back of the head, a kick in the groin, and a deafening thunderclap.",
            effectDescription: "During the target's turn, they are limited to either a single major action, a single move action, or a single minor action. Effects that grant additional actions do not circumvent this unless they grant a free action. Note that a target expending its move action to resist this bane will receive the remainder of their usual actions if the resist roll succeeds.",
            powerLevelDescriptions: {
               
            },
            specialText: "This bane has special rules for boss NPCs (See Chapter 8: Running the Game). A boss is only affected by the stunned bane during its normal initiative turn. It may still take all of its boss actions as usual."
        },
        {
            name: "Stupefied",
            powerLevels: [7],
            attributes: ["influence"],
            defenseTargets: {
                influence: "resolve"
            },
            duration: "1 minute",
            generalDescription: "The stupefied bane has examples in many stories and legends: a vampire's eyes, a siren's song, and a nymph's beauty are all known to cast a stupor upon weak-willed mortals. Being stupefied causes the target to be lulled into a false sense of security, tranquility, and pacifism.",
            effectDescription: "The target is in a state of mental fog, lowering their mental defenses. While stupefied, the target's Resolve defense is reduced to 10. In addition, the target has the approximate intelligence of a child.",
            powerLevelDescriptions: {
                
            },
            specialText: "While most banes last until the target actively attempts to resist it, this bane prevents the target from actively attempting to break free. However, the target's true mind is suppressed but fights to regain control. As such, at the end of each of its turns, the target receives a resist roll as a free action to break free from the effect."
        },
        {
            name: "Truthfulness",
            powerLevels: [5],
            attributes: ["influence"],
            defenseTargets: {
                influence: "resolve"
            },
            duration: "10 minutes",
            generalDescription: "By controlling the target's mind through compulsion magic, chemical injection, neural probes, or similar means, you render them incapable of lying deliberately. This is a favored bane among enchanters, mad scientists, psychics, and thought police.",
            effectDescription: "The target answers any question asked with honesty, to the best of their knowledge. When compelled to reveal something they would not reveal outside of duress, the target makes a Will roll and you make an Influence roll. If the target's roll is higher than yours, then they resist the bane and the effect ends.",
            powerLevelDescriptions: {
                
            },
            specialText: "When you successfully invoke this bane, at the end of its duration, you can make another Influence roll to attempt to persist the bane. If successful, the bane persists without requiring the invocation time to be repeated."
        }
    ],

    feats: [
        {
                   name: "Alternate Form",
                   cost: 3,
                   tiers: 2,
                   description: "You have the ability to transform from one persona to another, whether that be through bodily transformation like a werewolf or through exterior mechanisms, such as a cybernetically enhanced soldier who can call forth a symbiotic mech suit.",
                   prerequisites: {
                      
                   },
                   baseEffectDescription: "Upon taking this feat, you build a single alternate form using the normal character creation rules, though your <b>attribute and feat points are determined by your tier in this feat</b>.<br><br>Whenever your primary form gains new attribute points or levels up, your alternate form also gains points according to the above formulas. As a <b>focus action</b>, you may change between any two forms (including your primary form or any alternate form). You maintain this capability in all of your forms.<br><br>Each form is treated as a <b>completely different character for mechanical purposes</b> - possessing different attributes, feats, perks, flaws, and other defining characteristics. Your alternate form does, however, retain the ability to transform back into your primary form.<br><br><b>Hit Point Tracking:</b> In order to keep track of hit points, you should always record the total damage that your character has suffered. When transforming, your damage remains with you even if your maximum hit points change.<br><br><b>Example:</b> Dr. Jekyll has a max HP of 15 and Mr. Hyde has a max HP of 30. During combat, Mr. Hyde suffers 10 damage. When he later transforms back into Dr. Jekyll, the 10 damage remains and is subtracted from his new maximum, leaving the doctor with 5 out of 15 hit points.<br><br>Additionally, when changing forms, if your hit points would be reduced to less than 1, your hit point total becomes 1 instead.",
                   effects: {
                       1: "Half of your primary form's attribute points (rounded up), and 3 feat points.",
                       2: "Same attribute points as your primary form, and 3 feat points less than your primary form."
                   },
                   customInput: true,
                   customInputLabel: "Alternate Form Name:",
                   customInputPlaceholder: "Enter the name for your alternate form character...",
               },
               {
                   name: "Area Manipulation",
                   cost: 1,
                   tiers: 5,
                   description: "Whether unloading your assault rifle on full-automatic or hurling a ball of flame, you are exceptionally precise at choosing targets for area attacks, allowing you to avoid allies who would otherwise be caught in the line of fire.",
                   prerequisites: {
                     
                   },
                   baseEffectDescription: "For each tier of this feat you possess, you can omit a single 5-foot square from being targeted as part of an area attack.",
                   effects: {
                       1: "Omit 1 five-foot square from area attacks.",
                       2: "Omit 2 five-foot squares from area attacks.",
                       3: "Omit 3 five-foot squares from area attacks.",
                       4: "Omit 4 five-foot squares from area attacks.",
                       5: "Omit 5 five-foot squares from area attacks."
                   },
               },
               {
                   name: "Armor Mastery",
                   cost: 3,
                   tiers: 2,
                   description: "Whether you are a heavily armored mechanized knight or a nimble rogue in studded leather, you and your armor are one. Your training and experience at wearing armor allows you to maximize its protection and minimize its drawbacks.",
                   prerequisites: {
                      
                   },
                   baseEffectDescription: "Your training allows you to sleep in armor without gaining one level of the fatigued bane. In addition, while wearing armor, you gain the following benefits.",
                   effects: {
                       1: "The Fortitude prerequisite for wearing armor is reduced by 1. When wearing armor, you get a +1 armor bonus to your Guard defense.",
                       2: "The Fortitude prerequisite for wearing armor is reduced by 2. When wearing armor, you get a +2 armor bonus to your Guard defense. Any movement penalty is reduced by 5'."
                   },
               },
               {
                   name: "Attack Redirection",
                   cost: 3,
                   tiers: 1,
                   description: "You are adept at redirecting your enemy's attacks. Whether using fancy footwork, magical force, or tactical superiority, you know how to force your enemy to attack unintended targets.",
                   prerequisites: {
                       1: { attributes: {}, feats: ["Defensive Reflexes II"] }
                   },
                   baseEffectDescription: "When you make a defend action and your roll exceeds the attacker's action roll, you can choose to redirect the attack to a target that is neither you, nor the attacker. The original attack roll does not change, only the target. If the attack was a melee attack, you can redirect it to anyone within 5' of you (as opposed to within 5' of the attacker).",
                   effects: {
                   },
               },
               {
                   name: "Attack Specialization",
                   cost: 3,
                   tiers: 9,
                   description: "Like a samurai who masters the art of the katana or an elementalist who specializes in summoning flame, you are so well trained with a particular form of attack that you can devastate foes with much more skill than the average combatant.",
                   prerequisites: {
                       1: { powerLevel: 3, attributes: ["agility", "might", "alteration", "creation", "energy", "entropy", "influence", "movement", "prescience", "protection"], feats: [] },
                       2: { powerLevel: 3, attributes: ["agility", "might", "alteration", "creation", "energy", "entropy", "influence", "movement", "prescience", "protection"], feats: [] },
                       3: { powerLevel: 3, attributes: ["agility", "might", "alteration", "creation", "energy", "entropy", "influence", "movement", "prescience", "protection"], feats: [] },
                       4: { powerLevel: 5, attributes: ["agility", "might", "alteration", "creation", "energy", "entropy", "influence", "movement", "prescience", "protection"], feats: [] },
                       5: { powerLevel: 5, attributes: ["agility", "might", "alteration", "creation", "energy", "entropy", "influence", "movement", "prescience", "protection"], feats: [] },
                       6: { powerLevel: 5, attributes: ["agility", "might", "alteration", "creation", "energy", "entropy", "influence", "movement", "prescience", "protection"], feats: [] },
                       7: { powerLevel: 7, attributes: ["agility", "might", "alteration", "creation", "energy", "entropy", "influence", "movement", "prescience", "protection"], feats: [] },
                       8: { powerLevel: 7, attributes: ["agility", "might", "alteration", "creation", "energy", "entropy", "influence", "movement", "prescience", "protection"], feats: [] },
                       9: { powerLevel: 7, attributes: ["agility", "might", "alteration", "creation", "energy", "entropy", "influence", "movement", "prescience", "protection"], feats: [] }
                   },
                   baseEffectDescription: "When you take this feat, select one weapon or attack type. You gain advantage 1 per tier of this feat for any damaging attack made with your chosen attack type.",
                   effects: {
                       1: "Gain advantage 1 on damaging attacks with chosen weapon/attack type.",
                       2: "Gain advantage 2 on damaging attacks with chosen weapon/attack type.",
                       3: "Gain advantage 3 on damaging attacks with chosen weapon/attack type.",
                       4: "Gain advantage 4 on damaging attacks with chosen weapon/attack type.",
                       5: "Gain advantage 5 on damaging attacks with chosen weapon/attack type.",
                       6: "Gain advantage 6 on damaging attacks with chosen weapon/attack type.",
                       7: "Gain advantage 7 on damaging attacks with chosen weapon/attack type.",
                       8: "Gain advantage 8 on damaging attacks with chosen weapon/attack type.",
                       9: "Gain advantage 9 on damaging attacks with chosen weapon/attack type."
                   },
                   specialText: "In addition to purchasing multiple tiers of this feat, you may take this feat multiple times and select a new weapon or attack type each time. Your total advantage to an attack is equal to your tier for that particular weapon or attack type. For example, a character might have Attack Specialization II (Fire) for fire attacks and Attack Specialization IV (Longsword) for longsword attacks.",
                   customInput: true,
                   customInputLabel: "Weapon/Attack Type:",
                   customInputPlaceholder: "Enter the specific weapon or attack type (e.g., Longsword, Fireball, Unarmed Strike)..."
               },
               {
                   name: "Attribute Substitution",
                   cost: 2,
                   tiers: 2,
                   description: "Your prowess in an extraordinary, mental, or social attribute is linked in a way that empowers another attribute of your character, allowing you to use that attribute for tasks normally reserved for another. Examples of Attribute Substitution in play include a martial artist who is physically weak but capable of using internal chi to throw and disable opponents, an anatomical genius who uses logic to make vital strikes rather than their agility, or a gunslinger whose deadshot aim is the result of a dark pact.",
                   prerequisites: {   },
                   baseEffectDescription: "When you take this feat, you create a <b>permanent link between two attributes</b>: one stronger (the primary attribute) and one weaker (the dependent attribute). You may use your primary attribute in place of the dependent attribute for different purposes depending on which tier of the feat you have.<br><br><b>GM Approval Required:</b> The relationship formed by your two attributes is subject to case-by-case approval and must be approved by the GM first. The link must be logical and consistent with the story you are trying to tell.<br><br><b>Example:</b> A brawler who substitutes their Logic for their Might to represent their ability to use leverage in grappling rather than strength would likely not get to use their Logic score for an attempt to bend the bars on a prison cell.<br><br><b>Balancing:</b> The GM should prevent players from creating illogical substitutions that are purely aimed at making their characters unreasonably powerful.<br><br><b>Proper Examples:</b> Two examples of proper uses of this feat include a calculating warrior who studies angles, leverage, and physics to substitute Logic for Might, or a gunslinger who channels dark energy, giving her deadshot accuracy and substituting Entropy for Agility.",
                   effects: {
                       1: "Making non-attack, non-defend, non-invocation action rolls<br>Calculating hit points, defenses, and other secondary statistics<br>Meeting feat prerequisites<br>Other situations at the GM's discretion",
                       2: "Making attack and defend action rolls<br>Invoking banes and boons"
                   },
               }, 
               {
                   name: "Bane Focus",
                   cost: 2,
                   tiers: 1,
                   description: "You are specialized in the use of a particular bane that is iconic to your character. Perhaps you are a martial artist known for your stunning strikes, a sniper who knows how to slow a target's escape, or a fire mage who sets enemies ablaze with persistent burning damage.",
                   prerequisites: {
                   },
                   baseEffectDescription: "Choose a bane that you can invoke. When your roll on a damaging attack exceeds the target's defense by 5 or more (as opposed to the usual 10), you can inflict this bane for free. Each attack is still only capable of inflicting a single bane. Furthermore, when making a bane attack to inflict your chosen bane, you gain advantage 2 on the bane attack roll.",
                   effects: {
                   },
                   specialText: "You may take this feat multiple times. Each time you do, choose a different bane."
               },
               {
                   name: "Battlefield Opportunist",
                   cost: 2,
                   tiers: 5,
                   description: "Your battlefield prowess allows you to capitalize on windows of opportunity that others don't notice, making you far more deadly in melee combat. Whether you wield an axe, plasmablade, or your bare fists, foes struggle to maneuver around or away from you.",
                   prerequisites: {
                       1: { powerLevel: 4, attributes: ["agility", "might"], feats: [] },
                       2: { powerLevel: 4, attributes: ["agility", "might"], feats: [] },
                       3: { powerLevel: 4, attributes: ["agility", "might"], feats: [] },
                       4: { powerLevel: 4, attributes: ["agility", "might"], feats: [] },
                       5: { powerLevel: 4, attributes: ["agility", "might"], feats: [] }
                   },
                   baseEffectDescription: "You may make an additional opportunity attack per round for each tier of this feat you possess. You can only make one opportunity attack per triggering action (e.g., you cannot make multiple attacks against the same foe when they leave your threatened space).",
                   effects: {
                   },
                   specialText: ""
               },
               {
                   name: "Battlefield Punisher",
                   cost: 3,
                   tiers: 1,
                   description: "Not only can you deal out retributive damage, you can devastate your opponents with a signature secondary effect. Examples of this feat in action include a stalwart paladin who knocks foes prone, a ninja who blinds enemies, or a telekinetic psychic who hurls attacks away.",
                   prerequisites: {
                       1: { powerLevel: 5, attributes: ["agility", "might", "alteration", "creation", "energy", "entropy", "influence", "movement", "prescience", "protection"], feats: ["Battlefield Retribution"] }
                   },
                   baseEffectDescription: "Choose a bane you can inflict. Any time you use the defend action with an attribute that could inflict the chosen bane and deal 10 damage via the Battlefield Retribution feat, you may choose to automatically afflict the attacker with the chosen bane.",
                   effects: {
                   },
                   specialText: ""
               },
               {
                   name: "Battlefield Retribution",
                   cost: 2,
                   tiers: 1,
                   description: "You are a master of the counter attack. This might take the form of deftly redirecting a strike back upon the attacker or even energetic feedback from an extraordinary barrier that damages the attacker. Your prowess on the battlefield allows you to not only intercept attacks but also decimate your foes with retributive damage.",
                   prerequisites: {
                       1: { powerLevel: 4, attributes: ["agility", "might", "alteration", "creation", "energy", "entropy", "influence", "movement", "prescience", "protection"], feats: [] }
                   },
                   baseEffectDescription: "When you use the defend interrupt action, you also deal damage to the attacker equal to the amount by which your action roll exceeds the attacker's roll.",
                   effects: {
                   },
                   specialText: ""
               },
               {
                   name: "Battle Trance",
                   cost: 3,
                   tiers: 1,
                   description: "You can enter a heightened mental state of combat readiness, in which your body is strengthened and your mind transcends fear and pain. Examples include a raging barbarian or an unstoppable samurai with laser focus in the heat of battle.",
                   prerequisites: {
                       1: { powerLevel: 3, attributes: ["fortitude", "will"], feats: [] }
                   },
                   baseEffectDescription: "As a <b>free action on your turn</b>, you may enter a battle trance.<br><br><b>While entranced:</b><br>• You have <b>advantage 1 on all attacks</b><br>• Your <b>Toughness and Resolve defenses are increased by 3</b><br>• If your total armor bonus is less than 3, it becomes 3<br><br><b>Battle Trance Ends:</b> If you take three consecutive turns without making an attack roll against an enemy creature, the battle trance ends.<br><br><b>Fatigue:</b> When the battle trance ends, you automatically suffer 1 level of the fatigue bane.",
                   effects: {
                   },
                   specialText: ""
               },
               {
                   name: "Boon Access",
                   cost: 1,
                   tiers: 9,
                   description: "You have a special gift: it might be the result of your heritage, a close encounter with magical energy, or the result of years of training with a master. In any case, although you do not necessarily possess the aptitude to work extraordinary powers for yourself or create a desired effect with your physical capabilities alone, you are able to reliably replicate a single boon.",
                   prerequisites: {
                       
                   },
                   baseEffectDescription: "When you choose this feat, choose <b>one boon that you do not have the requisite attribute to invoke</b>. The cost of this feat is equal to the power level of the chosen boon.<br><br><b>Invocation:</b> You can invoke the chosen boon despite lacking the necessary attribute. For invocation rolls, treat your attribute score as the power level of the boon.<br><br><b>Multiple Prerequisites:</b> If the boon has multiple attribute prerequisite options, you choose one attribute when you take this feat.<br><br><b>Feat Prerequisites:</b> Additionally, you count as having access to the chosen boon for the purpose of meeting feat prerequisites, and your attribute for meeting such prerequisites is equal to the power level of the boon.<br><br><b>Level Restrictions Bypassed:</b> The Boon Access feat bypasses the normal attribute score restrictions based on character level, so a first level character could spend all 6 of their feat points to begin play with access to a power level 6 boon.<br><br><b>Multiple Uses:</b> You may acquire this feat multiple times. Each time, select a new boon.",
                   effects: {
                       1: "Access to a power level 1 boon without attribute prerequisites.",
                       2: "Access to a power level 2 boon without attribute prerequisites.",
                       3: "Access to a power level 3 boon without attribute prerequisites.",
                       4: "Access to a power level 4 boon without attribute prerequisites.",
                       5: "Access to a power level 5 boon without attribute prerequisites.",
                       6: "Access to a power level 6 boon without attribute prerequisites.",
                       7: "Access to a power level 7 boon without attribute prerequisites.",
                       8: "Access to a power level 8 boon without attribute prerequisites.",
                       9: "Access to a power level 9 boon without attribute prerequisites."
                   },
                   specialText: "You may take this feat multiple times. Each time you do, choose a new boon to gain access to. Note that this feat can give access to high-powered boons with a potential for very dramatic impact on the storyline of a game. As such, using this feat to access a boon of power level 6 or higher should be approved by the GM before using it in a game. If you ever meet the attribute prerequisite for the chosen boon, you may choose at that time to lose this feat and regain the feat points spent. Re-allocate them as you choose.",
                   customInput: true,
                   customInputLabel: "Boon Name:",
                   customInputPlaceholder: "Enter the name of the boon you want to gain access to..."
               },
               {
                   name: "Boon Focus",
                   cost: 3,
                   tiers: 3,
                   description: "You are specialized in the use a particular boon that is iconic to your character. Examples of this feat in action include a druid who can shapechange at-will, a combat medic who can tend the wounds of many with expert skill, and a mad scientist who can animate mechanical minions effortlessly.",
                   prerequisites: {
                   },
                   baseEffectDescription: "Choose a single boon that you can invoke. You gain benefits with that boon according to your tier in this feat.",
                   effects: {
                       1: "When you invoke the chosen boon on a single target, you succeed automatically and do not need to make an action roll. You can invoke the boon at any of the power levels you could access via your other means. If the invocation is not a single target, success is not automatic, but you get advantage 2 on the action roll to invoke the boon.",
                       2: "You gain advantage 3 on your action roll to invoke the boon if you are not single-targeting. Additionally, you may invoke the boon one time increment faster, as follows: If the invocation time is a major action or move action, it becomes a minor action. If the invocation time is 1 focus action, it becomes 1 major action. If the invocation time is 1 minute, it becomes 1 focus action. If the invocation time is 10 minutes, it becomes 1 minute. If the invocation time is 1 hour, it becomes 10 minutes. If the invocation time is 8 hours, it becomes 1 hour. If the invocation time for a boon is 1 minor action, it can be invoked only once as a minor action. Beyond that it can be invoked by expending a move or major action.",
                       3: "The effect at tier 3 varies based on the duration of the boon:<br><b>If the chosen boon has a duration of \"sustain persists\"</b>, you gain advantage 4 on your action roll to invoke if you are not single-targeting. Additionally, one instance of the boon can be sustained each round as a free action, rather than a minor action. If the boon is somehow temporarily canceled, in the absence of other rules, you can invoke it again as a free action. If targeted by the nullify bane, this effect can only be canceled by a power level 6 or greater invocation of that bane.<br><b>If the boon has a different duration</b>, you gain advantage 5 on your action roll to invoke if you are not single-targeting."
                   },
                   specialText: "In addition to purchasing multiple tiers of this feat, you may take this feat multiple times and select a new boon each time. Your tier of this feat is independent for each boon."
               }, {
                   name: "Breakfall",
                   cost: 2,
                   tiers: 2,
                   description: "You are as graceful as a swan. Like the martial artists and swashbucklers of legendary tales, your agility enables you to fall from deadly heights unharmed.",
                   prerequisites: {
                       1: { powerLevel: 4, attributes: ["agility"], feats: [] },
                       2: { powerLevel: 4, attributes: ["agility"], feats: [] }
                   },
                   baseEffectDescription: "",
                   effects: {
                       1: "As long as you are conscious and able to act, reduce all falling damage by half.",
                       2: "As long as you are conscious and able to act, you do not suffer falling damage."
                   },
                   specialText: ""
               },
               {
                   name: "Brutal Intimidation",
                   cost: 1,
                   tiers: 1,
                   description: "Your powers of persuasion stem from application of brute force rather than your social grace. When you smash a table, brandish your blade, or flex your muscles, people stop what they are doing and listen to you.",
                   prerequisites: {
                       1: { powerLevel: 2, attributes: ["might"], feats: [] }
                   },
                   baseEffectDescription: "If you're able to make a show of physical force, you can use your Might attribute in place of Persuasion for the action roll.",
                   effects: {
                   },
                   specialText: ""
               }, {
                   name: "Climbing",
                   cost: 1,
                   tiers: 1,
                   description: "You gain the ability to climb or parkour perfectly, akin to certain vampires, aberrant creatures, ninjas, and insects.",
                   prerequisites: {
                   },
                   baseEffectDescription: "You gain a climb speed equal to your base speed and can scale horizontal and vertical surfaces, even climb upside-down, with no fear of falling.",
                   effects: {
                   },
                   specialText: ""
               },
               {
                   name: "Combat Follow-through",
                   cost: 2,
                   tiers: 1,
                   description: "You are able to decimate many enemies in quick succession. Like a legendary Samurai warrior or matchless elven archer, your foes fall in waves before you.",
                   prerequisites: {
                       
                   },
                   baseEffectDescription: "Every time you bring an enemy to zero hit points with a Might or Agility attack, you can immediately make an extra attack as a free action.",
                   effects: {
                   },
                   specialText: ""
               },
               {
                   name: "Combat Momentum",
                   cost: 1,
                   tiers: 1,
                   description: "Whether through brute strength or lightning reflexes, you are able to use the momentum of combat to maneuver around the battlefield with ease.",
                   prerequisites: {
                       1: { attributes: { }, feats: [] }
                   },
                   baseEffectDescription: "Every time you bring an enemy to zero hit points with a Might or Agility attack, you can immediately move up to your normal speed as a free action.",
                   effects: {
                   },
                   specialText: "If you have access to the teleport boon, you may use it instead of a normal move."
               },
               {
                   name: "Companion",
                   cost: 2,
                   tiers: 3,
                   description: "Whether a hired bodyguard, a loyal animal sidekick, or a sibling that follows you everywhere, you have the constant and unflinching loyalty of one particular companion character.",
                   prerequisites: {
                       
                   },
                   baseEffectDescription: "You gain a <b>companion character that acts independently from you</b>.<br><br><b>Combat:</b> During combat, your companion acts on its own initiative count and gains the usual assortment of actions, which you may choose.<br><br><b>Character Creation:</b> You also get to assign your companion's attributes.<br><br><b>Reassignment:</b> Whenever you gain a level or purchase a new tier in this feat, you may reassign your companion's attributes and feats.",
                   effects: {
                       1: "Your companion has a total of 20 attribute points plus 4 per level of your character.",
                       2: "Your companion receives 3 feat points.",
                       3: "Your companion has a total of 30 attribute points plus 6 per level of your character. In addition, you can optionally grant feats to your companion. In order to do so, you spend your own feat points and the companion receives the feat instead of you. The companion, not you, must meet all feat prerequisites. Any math related to these feats are calculated based on the companion's attributes, feats, etc. If you have spent feat points this way and would gain feat points from any other effect, those feat points are reduced by the number of feat points you have granted to your companion."
                   },
                   specialText: "If you ever lose your companion, voluntarily or involuntarily, you regain the feat points that you have spent on this feat and any of the companion's feats, and may spend them as usual. In addition to purchasing multiple tiers of this feat, you may take this feat multiple times and select a new companion each time."
               },
               {
                   name: "Craft Mundane Item",
                   cost: 2,
                   tiers: 2,
                   description: "You have mastered a particular craft, and given proper time and materials, you can create items related to that craft. You might be an expert blacksmith, professional engineer, master alchemist, or any similar manner of professional craftsman.",
                   prerequisites: {
                        1: { powerLevel: 3, attributes: ["learning", "logic"], feats: ["Knowledge"], featRequirementLogic: "or" },
                        2: { powerLevel: 3, attributes: ["learning", "logic"], feats: ["Knowledge"], featRequirementLogic: "or" }
                   },
                   baseEffectDescription: "Choose a specific craft or profession. You can create items that are relevant to your chosen craft, and your GM will determine the speed at which you craft based on the nature of the item and the materials you have access to. Your tier in the Craft Mundane Item feat determines the maximum wealth level of the items you can craft. Unlike acquiring items by using your wealth (described in Chapter 5), crafting does not limit your ability to acquire additional goods.<br><b>Craft Examples (This list is not exhaustive, and you can work with your GM to come up with other suitable crafts):<ul><li>Alchemy - acid, chemicals, non-magical tinctures, incense, reagents.</li><li>Arcane - magical ingredients, inks, scrolls, exotic components.</li><li>Blacksmithing - metal, leather, weapons, armor, wheels, horseshoes.</li><li>Chemistry - acid, explosives, narcotics.</li><li>Engineering - machines, wheels, gears, guns, vehicles.</li><li>Geography - maps, cartography, instruments of navigation.</li><li>Herbalism - poultices, natural remedies, stimulants, brewing.</li><li>Medicine - medical tools, tonics, tinctures, pain relievers, anti-toxins.</li></ul>",
                   effects: {
                       1: "You can craft items equal to your wealth level",
                       2: "You can craft items equal to your wealth level + 1"
                   },
                   specialText: "In addition to taking multiple tiers of this feat, you may take this feat multiple times and select a new craft or profession each time.",
                   customInput: true,
                   customInputLabel: "Craft/Profession:",
                   customInputPlaceholder: "Enter the specific craft or profession (e.g., Blacksmithing, Alchemy, Engineering)..."
               },
               {
                   name: "Craft Extraordinary Item",
                   cost: 3,
                   tiers: 3,
                   description: "You are studied in the ways of imbuing magical items, building futuristic technology, brewing potions, or crafting extraordinary devices. Their power is permanent but varies depending on your skill.",
                   prerequisites: {
                       1: { powerLevel: 5, attributes: ["learning", "logic", "alteration", "creation", "energy", "entropy", "influence", "movement", "prescience", "protection"], feats: [] },
                       2: { powerLevel: 5, attributes: ["learning", "logic", "alteration", "creation", "energy", "entropy", "influence", "movement", "prescience", "protection"], feats: [] },
                       3: { powerLevel: 5, attributes: ["learning", "logic", "alteration", "creation", "energy", "entropy", "influence", "movement", "prescience", "protection"], feats: [] }
                   },
                   baseEffectDescription: "Provided you have the <b>appropriate working space and materials</b> (as determined by the GM), you can create extraordinary items (as detailed in Chapter 9: Special Equipment).<br><br><b>Access Requirements:</b> You can only imbue an item with attributes, banes, and boons that you can access. For example, in order to create a sword with Energy 5, you must possess an Energy score of 5 or higher.<br><br><b>Special Attributes:</b> The only exception to this is if you possess the <b>Creation, Learning, or Logic attributes</b>. These allow you to imbue items with any attribute, bane, or boon as long as their value is less than or equal to your attribute score. The GM may rule that certain uses of Creation, Learning, or Logic are unreasonable when it comes to crafting extraordinary items.<br><br><b>Wealth Level Limits:</b> Your tier in this feat determines the maximum wealth level of the items you can create, based on the attribute you are using to craft.<br><br><b>Example:</b> A character with Creation 5 and tier 1 in this feat could create items up to wealth level 3.<br><br><b>Item Development:</b> You can determine the wealth level of the item you want to create by consulting the sample items in Chapter 9: Special Equipment or by developing a custom item using the rules for Building Your Own Extraordinary Items in that chapter.<br><br><b>Crafting Time:</b> Creating an item with the consumable or expendable property requires one full 8-hour day of uninterrupted work. Other items require a duration of uninterrupted work based on their wealth level, as follows:<ul><li>Wealth Level 1 - 3: Two days per wealth level.</li><li>Wealth Level 4 - 5: Four days per wealth level.</li><li>Wealth Level 6 - 7: One week per wealth level.</li><li>Wealth Level 8 - 9: One month per wealth level.</li></ul><br><b>Wealth Cost:</b> At the end of this time, your item is created. Crafting an item still counts as an expenditure of wealth, so you must have a sufficient wealth score to purchase the item, following all the rules for spending wealth provided in Chapter 5: Wealth & Equipment.<br><br><b>Special Materials:</b> The GM may waive some or all of the costs associated with an item if you possess special materials for the crafting of your item. For example, if you have recently collected the hide of a slain red dragon and decide to make a suit of Armor of Fire Resistance, the GM may decide that the dragon's hide is enough to make up most of the costs of the armor, so the armor's wealth level is reduced by 3 for purposes of determining crafting costs.",
                   effects: {
                       1: "Maximum wealth level equals attribute minus 2.",
                       2: "Maximum wealth level equals attribute minus 1.",
                       3: "Maximum wealth level equals attribute."
                   },
                   specialText: ""
               },
               {
                   name: "Crushing Blow",
                   cost: 3,
                   tiers: 1,
                   description: "Like a reckless ogre wading through combat, your relentless blows not only knock your opponents back, but also knock them off their feet completely.",
                   prerequisites: {
                       1: { powerLevel: 6, attributes: ["might"], feats: ["Overpowering Strike"] }
                   },
                   baseEffectDescription: "Any time that you deal damage to an enemy, in addition to pushing them 5 feet (if you choose) from the Overpowering Strike feat, you can also knock them down in the space where the forced move ends; the target suffers the effects of the knockdown bane.",
                   effects: {
                   },
                   specialText: ""
               },
               {
                   name: "Death Blow",
                   cost: 3,
                   tiers: 2,
                   description: "You are able to quickly finish off enemies that are near death and silence them before they cry out. This attack is one that is commonly seen used by rogues, assassins, and snipers who can silently eliminate weaker enemies without being detected.",
                   prerequisites: {
                       1: { powerLevel: 6, attributes: ["agility"], feats: ["Lethal Strike I"] },
                       2: { powerLevel: 7, attributes: ["agility"], feats: ["Lethal Strike II"] }
                   },
                   baseEffectDescription: "",
                   effects: {
                       1: "If you damage an enemy with a Lethal Strike and their total HP is 5 or less after the attack, then you can choose to reduce them to zero HP instead. In addition, you can choose to silence any enemy reduced to zero hit points by an attack from you.",
                       2: "Your death blow HP threshold increases from 5 to 10. In addition, on a successful Lethal Strike, the stunned bane is automatically inflicted without counting against your usual 1 bane per attack limit."
                   },
                   specialText: ""
               },
               {
                   name: "Deathless Trance",
                   cost: 3,
                   tiers: 1,
                   description: "Whether you are a berserker of the icy north, a hulking superhero of unstoppable might, or a cybernetically enhanced soldier, your battle fury is legendary. You possess the rare ability to fight on long after your body should have given up.",
                   prerequisites: {
                       1: { powerLevel: 7, attributes: ["fortitude"], feats: ["Battle Trance"] }
                   },
                   baseEffectDescription: "While in a battle trance you cannot be knocked unconscious. All damage dealt to you should be recorded, possibly resulting in a negative hit point total. Despite any amount of damage, you remain conscious for as long as you can sustain the battle trance. When the battle trance ends, if your hit points are below zero, you collapse unconscious. If you are not healed to zero or more hit points within 1 round of your battle trance ending, you die.",
                   effects: {
                   },
                   specialText: ""
               },
               {
                   name: "Defensive Mastery",
                   cost: 3,
                   tiers: 1,
                   description: "You know how to turn a strong offense into an even stronger defense. Your special training or experience with defensive implements and shields allows you to capitalize on their defensive benefits far beyond the average wielder. Examples include a martial artist's defensive kata or a soldier equipped with a riot shield.",
                   prerequisites: {
                   },
                   baseEffectDescription: "When wielding a weapon or implement with the defensive property, you gain an additional +1 armor bonus. In addition, the defensive value of the item is increased by 1 when you wield it. So defensive 1 becomes defensive 2 and defensive 2 becomes defensive 3.",
                   effects: {
                       
                   },
                   specialText: ""
               },
               {
                   name: "Defensive Reflexes",
                   cost: 2,
                   tiers: 9,
                   description: "You are a paragon of defensive fighting, able to masterfully thwart enemy attacks. By predicting your opponents' movements, strikes, or shots, you can cut them off before they are a threat.",
                   prerequisites: {
                       1: { powerLevel: 3, attributes: ["agility"], feats: [] },
                       2: { powerLevel: 3, attributes: ["agility"], feats: [] },
                       3: { powerLevel: 3, attributes: ["agility"], feats: [] },
                       4: { powerLevel: 5, attributes: ["agility"], feats: [] },
                       5: { powerLevel: 5, attributes: ["agility"], feats: [] },
                       6: { powerLevel: 5, attributes: ["agility"], feats: [] },
                       7: { powerLevel: 7, attributes: ["agility"], feats: [] },
                       8: { powerLevel: 7, attributes: ["agility"], feats: [] },
                       9: { powerLevel: 7, attributes: ["agility"], feats: [] }
                   },
                   baseEffectDescription: "Any time you use the defend action, you gain advantage 1 on the action roll per tier you possess of this feat.",
                   effects: {
                       1: "Gain advantage 1 on defend actions.",
                       2: "Gain advantage 2 on defend actions.",
                       3: "Gain advantage 3 on defend actions.",
                       4: "Gain advantage 4 on defend actions.",
                       5: "Gain advantage 5 on defend actions.",
                       6: "Gain advantage 6 on defend actions.",
                       7: "Gain advantage 7 on defend actions.",
                       8: "Gain advantage 8 on defend actions.",
                       9: "Gain advantage 9 on defend actions."
                   },
                   specialText: ""
               },
               {
                   name: "Destructive Trance",
                   cost: 3,
                   tiers: 1,
                   description: "In the heat of combat, you become a destructive force to be reckoned with. Whether a raging barbarian or a hyper-focused intergalactic knight, your attacks become particularly ferocious when you enter your battle trance.",
                   prerequisites: {
                       1: { powerLevel: 7, attributes: ["agility", "might", "energy", "entropy"], feats: ["Battle Trance"] }
                   },
                   baseEffectDescription: "When you make an attack roll in a battle trance, all of the dice in your dice pool explode on either maximum or the number 1 below maximum (though the total is still the number rolled). This means that d4s explode on a 3 or 4, d6s explode on a 5 or 6, d8s explode on a 7 or 8, and so on.",
                   effects: {
                   },
                   specialText: ""
               },
               {
                   name: "Diehard",
                   cost: 2,
                   tiers: 1,
                   description: "Whether luck shines upon you or you're just really hard to kill, you have a knack for staying in the fight when others would tap out. You might be a plucky rogue who always finds a safe nook to duck into or a veteran marine specially trained to grit your teeth and buck up when things look grim.",
                   prerequisites: {
                       1: { powerLevel: 3, attributes: ["presence", "fortitude"], feats: [] }
                   },
                   baseEffectDescription: "Once per day, an attack that would reduce you to less than 1 HP, reduces you to 1 HP instead.",
                   effects: {
                   },
                   specialText: ""
               },
               {
                   name: "Energy Resistance",
                   cost: 2,
                   tiers: 4,
                   customInput: true,
                   customInputLabel: "Energy Type",
                   customInputPlaceholder: "e.g., fire, cold, lightning, acid, poison",
                   description: "Whether due to inherited racial traits, specialization in a particular type of energy, or inherent extraordinary protection, you are resistant to a specific type of energy. A fiery sorceress immune to the hottest blaze or a biologically anomalous alien race that is immune to poison are both examples of this feat in play.",
                   prerequisites: {
                      
                   },
                   baseEffectDescription: "Choose from the following energy types: fire, cold, lightning, acid, poison, or another at the GM's discretion. When you are attacked with that energy type, you gain resistance to the attack as follows:",
                   effects: {
                       1: "Your defense scores are increased by 3 against the chosen energy type.",
                       2: "Your defense scores are increased by 6 against the chosen energy type.",
                       3: "Your defense scores are increased by 9 against the chosen energy type.",
                       4: "You are immune to damage and harmful effects from the chosen energy type."
                   },
                   specialText: "In addition to purchasing multiple tiers of this feat, you may take this feat multiple times and select a new energy type each time."
               },
               {
                   name: "Evasive Footwork",
                   cost: 2,
                   tiers: 1,
                   description: "You are able to dodge and weave in combat, deftly sidestepping attacks that would threaten a clumsier combatant. An agile ninja who tumbles and flips around foes and an alien snake creature that slithers throughout the battlefield are both examples of this feat in play.",
                   prerequisites: {
                       1: { powerLevel: 4, attributes: ["agility"], feats: [] }
                   },
                   baseEffectDescription: "When you move from a space adjacent to an enemy to another space not adjacent to that enemy, the enemy does not get the usual opportunity attack.",
                   effects: {
                   },
                   specialText: ""
               },
               {
                   name: "Extraordinary Defense",
                   cost: 3,
                   tiers: 3,
                   description: "Whether by a magical barrier of force, foresight into the future, or preternatural speed, you are gifted with extraordinary protection from harm. Attacks are less likely to strike you, and when they do, they aren't as damaging as they would be to others.",
                   prerequisites: {
                       1: { powerLevel: 2, attributes: ["movement", "prescience", "protection"], feats: [] },
                       2: { powerLevel: 3, attributes: ["movement", "prescience", "protection"], feats: [] },
                       3: { powerLevel: 4, attributes: ["movement", "prescience", "protection"], feats: [] }
                   },
                   baseEffectDescription: "You gain a +1 bonus to all defenses for each tier you have in this feat. This increases your Toughness, Guard, and Resolve defenses.",
                   effects: {
                   },
                   specialText: ""
               },
               {
                   name: "Extraordinary Focus",
                   cost: 3,
                   tiers: 1,
                   description: "Your extraordinary power stems from your connection with a particular focus, such as a wand, digital psi amplifier, holy symbol, or spellbook. When this focus item is in your hands, you are a force to be reckoned with compared to others with similar powers.",
                   prerequisites: {
                       1: { powerLevel: 1, attributes: ["alteration","creation", "energy", "entropy", "influence", "movement", "prescience", "protection"], feats: [] }
                   },
                   baseEffectDescription: "With the approval of your GM, choose a focus from which your power with a single extraordinary attribute stems. Some possibilities include a wand, a digital psi amplifier, a crystal ball, a spell book, a holy symbol, a weapon, your voice, or an animal familiar. You cannot use the selected extraordinary attribute without your focus. The focus heightens your power and for the purposes of determining your attribute dice for action rolls, you treat the chosen attribute as if it was one greater. For all purposes outside of attribute dice, your ability score remains unchanged (feats, banes, boons, etc.).",
                   effects: {
                   },
                   specialText: "If you ever lose your extraordinary focus, voluntarily or involuntarily, you regain the feat points that you have spent on this feat and may spend them as usual. You may take this feat multiple times. If you do, select a new attribute not chosen previously. For each instance of this feat, you may choose an existing focus or select a new one.",
                   customInput: true,
                   customInputLabel: "Choose Extraordinary Attribute:",
                   customInputPlaceholder: "Select the attribute that your extraordinary focus affects..."
               },
               {
                   name: "Extraordinary Healing",
                   cost: 3,
                   tiers: 1,
                   description: "Whether you summon priestly magics, utilize advanced technologies, or apply alchemical concoctions, your mastery of extraordinary healing is such that you are able to cure mortal wounds that are beyond the power of the average healer.",
                   prerequisites: {
                       1: { powerLevel: 5, attributes: ["creation"], feats: [] }
                   },
                   baseEffectDescription: "When invoking the heal boon, you can choose to take one hour instead of the usual invocation time. If you do, you heal an amount of lethal damage equal to the total healing from the successful boon invocation. This lethal damage is healed in addition to the normal hit point damage that your boon heals.",
                   effects: {
                      
                   },
                   specialText: ""
               },
               {
                   name: "Fast Draw",
                   cost: 1,
                   tiers: 1,
                   description: "Whether you're a samurai warrior, the fastest draw in the West, or a flawlessly trained interstellar soldier, you can get to your weapon faster than your opponent can blink.",
                   prerequisites: {
                       1: { powerLevel: 1, attributes: ["agility"], feats: [] }
                   },
                   baseEffectDescription: "Once per round, you can draw one additional weapon and sheathe another as a free action. Alternately, you could do the same with any small sized object in your possession.",
                   effects: {
                   },
                   specialText: ""
               },
               {
                   name: "Fast Tracker",
                   cost: 2,
                   tiers: 1,
                   description: "Following a trail is an everyday part of your life, and as such it is no more taxing than breathing or blinking. Whether you are an experienced woodsman, a bounty hunter for the Galactic Senate, or a humanoid cat creature with heightened senses, your expertise at tracking allows you to get it done faster than the average hunter.",
                   prerequisites: {
                       1: { powerLevel: 5, attributes: ["agility", "perception"], feats: [], attributeRequirementLogic: "and" }
                   },
                   baseEffectDescription: "You move unhindered and at full speed when tracking your quarry.",
                   effects: {
                   },
                   specialText: ""
               },
               {
                   name: "Ferocious Minions",
                   cost: 2,
                   tiers: 3,
                   description: "Whether you are a necromancer who summons hordes of undead, an inventor who crafts autonomous defense droids, or a psychic capable of bending others to your will, minions are exceptionally strong under your command.",
                   prerequisites: {
                       1: { powerLevel: 4, attributes: ["alteration","creation", "energy", "entropy", "influence"], feats: [] },
                       2: { powerLevel: 5, attributes: ["alteration","creation", "energy", "entropy", "influence"], feats: [] },
                       3: { powerLevel: 7, attributes: ["alteration","creation", "energy", "entropy", "influence"], feats: [] }
                   },
                   baseEffectDescription: "Creatures under the effects of your charmed or dominated banes, or those created by your invocation of the summon creature boon, gain advantage 1 on all attack rolls to protect you or act in your favor for each tier of this feat you possess.",
                   effects: {
                       
                   },
                   specialText: ""
               },
               {
                   name: "Fleet of Foot",
                   cost: 2,
                   tiers: 3,
                   description: "You are exceptionally fast and agile, able to move with incredible speed and grace across any terrain.",
                   prerequisites: {
                       1: { powerLevel: 2, attributes: ["agility", "fortitude", "movement" ], feats: [] },
                       2: { powerLevel: 4, attributes: ["agility", "fortitude", "movement" ], feats: [] },
                       3: { powerLevel: 6, attributes: ["agility", "fortitude", "movement" ], feats: [] }
                   },
                   baseEffectDescription: "Your movement speed is increased by 5 feet per tier.",
                   effects: {
                       1: "Increase movement speed by 5 feet.",
                       2: "Increase movement speed by 10 feet.",
                       3: "Increase movement speed by 15 feet."
                   },
                   specialText: ""
               },
               {
                   name: "Flying",
                   cost: 3,
                   tiers: 1,
                   description: "Whether through a pair of celestial or infernal wings, an inherent telekinetic force, or mutant super powers, you possess the ability to fly.",
                   prerequisites: {
                   },
                   baseEffectDescription: "You gain a flight speed equal to your normal speed. At the GM's discretion, certain hostile actions may be capable of canceling your flight, sending you hurtling to your doom. If your flight is anatomical, the immobile bane might render your wings immovable. If telekinetic, an application of the nullify bane may cancel your flight.",
                   effects: {
                   },
                   specialText: ""
               },
               {
                   name: "Great Leap",
                   cost: 1,
                   tiers: 3,
                   description: "Through extraordinary power or exceptional agility, you can jump much farther than the average creature. A telekinetic superhero and an insectoid race of bipedal cricket-like beings are both examples of this feat in play.",
                   prerequisites: {
                       1: { powerLevel: 2, attributes: ["agility", "movement"], feats: [] },
                       2: { powerLevel: 4, attributes: ["agility", "movement"], feats: [] },
                       3: { powerLevel: 6, attributes: ["agility", "movement"], feats: [] }
                   },
                   baseEffectDescription: "You can use your Movement or Agility score instead of your Might score when determining how far you can jump. In addition, you gain advantage 1 per tier on action rolls to jump.",
                   effects: {
                   },
                   specialText: ""
               },
               {
                   name: "Hallucination",
                   cost: 3,
                   tiers: 2,
                   description: "You are able to use your powers of illusion to not only create phantasmal figments, but to completely dominate the sensory perceptions of individual targets. Such power is wielded by the likes of legendary enchanters, psychics, and shamans. Those who can master such powers are often capable of neutralizing angry mobs without shedding a drop of blood.",
                   prerequisites: {
                       1: { powerLevel: 5, attributes: ["influence"], feats: [] },
                       2: { powerLevel: 7, attributes: ["influence"], feats: [] }
                   },
                   baseEffectDescription: "",
                   effects: {
                       1: "When you invoke the phantasm bane, you may choose to create a hallucination within a single target's mind instead of an illusion that is perceptible to everyone. You gain complete control over the target's senses (as granted by the power level of your bane), and thus the hallucination is not restricted by size or area. Your hallucination may only target a single creature and is not eligible for multi-targeting attacks. In addition, unless the target is damaged, they suffer disadvantage on resist rolls against the bane.",
                       2: "When you invoke the hallucination form of the phantasm bane, you may target additional creatures within range as determined by your Influence score. This does not count as a multi-target attack and thus does not incur disadvantage on your action roll.<ul><li>Influence 7 - 5 targets</li><li>Influence 8 - 10 targets</li><li>Influence 9 - 50 targets</li></ul>"
                   },
                   specialText: ""
               },
               {
                   name: "Heightened Invocation",
                   cost: 2,
                   tiers: 3,
                   description: "By channeling your extraordinary powers through extended research or extensive rituals, such as meditation, fasting, blood letting, or sacrifices, you are able to increase the strength of your invocations. This feat is common among wizards, inventors, mad scientists, and similar characters who use extraordinary abilities to achieve great deeds.",
                   prerequisites: {
                       1: { powerLevel: 4, attributes: ["alteration","creation", "energy", "entropy", "influence", "movement", "prescience", "protection"], feats: [] },
                       2: { powerLevel: 6, attributes: ["alteration","creation", "energy", "entropy", "influence", "movement", "prescience", "protection"], feats: [] },
                       3: { powerLevel: 9, attributes: ["alteration","creation", "energy", "entropy", "influence", "movement", "prescience", "protection"], feats: [] }
                   },
                   baseEffectDescription: "When invoking a bane or boon, you may choose to do so as a <b>heightened invocation</b>.<br><br><b>Invocation Time:</b> The invocation time for a heightened invocation is one increment higher than usual as follows:<ul><li>1 action becomes 1 minute</li><li>1 minute becomes 10 minutes</li><li>10 minutes becomes 1 hour</li><li>1 hour becomes 8 hours</li><li>8 hours becomes 24 hours</li></ul>",
                   effects: {
                       1: "When performing a heightened invocation, you may choose one of the following effects to empower your bane or boon:<ul><li>Increase the range of the effect as follows:<ul><li>Attribute 5 = 500ft</li><li>Attribute 6 = 1/2 mile</li><li>Attribute 7 = 1 mile</li><li>Attribute 8 = 10 miles</li><li>Attribute 9 = 100 miles</li></ul><li>Negate two levels of disadvantage caused by multi-targeting (e.g., target 2 creatures or a 10' square for free instead of disadvantage 2).</li><li>For your action roll, treat your attribute score as if it was one greater for purposes of determining attribute dice. Note that this doesn't grant access to banes or boons you could not normally access. It only increases the dice used for the action roll.</li></ul>",
                       2: "You gain the following options when you perform a heightened invocation:<ul><li>You can lead others to join you in group invocation as long as they are also able to invoke the bane or boon at the same power level that you are invoking it at. At the conclusion of the group invocation, each contributor may choose one of the effects granted by Tier 1 of this feat.</li><li>You gain the following additional options to choose from when empowering your invocations with heightened invocation:<ul><li>Cause a boon to persist for 1 minute automatically without needing to use a sustain action. Furthermore, enemies cannot end the boon through use of a disrupting attack (though the nullify bane still works).</li><li>Targets may not make resist rolls against a bane for one minute after it is invoked.</li></ul></li></ul>",
                       3: "You gain the ability to permanently bestow or dispel banes and boons. In order to bestow the bane or boon, you must rigorously attend to the invocation process for a number of days equal to the power level of the bane or boon to be invoked or nullified. During that time you can eat, sleep, and act normally with two exceptions: 1) You must work actively on the invocation and with minimal interruption for 8 hours out of each day. 2) You can leave the area and move about freely during the down time each day, but for the 8 hours of active heightened invocation you must be in the same physical or geographic location where the invocation was initiated. When the invocation time is completed, make an action roll as follows:<ul><li><b>Bestow Boon</b> - Make an action roll to invoke the boon as usual. If successful, you cause a non-instantaneous & non-permanent boon to permanently affect the target. The target can thereafter invoke the boon at will with a free action, without requiring an action roll to do so. The target does not need to use a sustain action to persist the effect, and the effect can only be nullified either temporarily with the nullify bane, or permanently with the Heightened Invocation feat (see the Dispel Boon entry that follows).</li><li><b>Bestow Bane</b> - Make an action roll to invoke the bane as usual. If successful, you cause a non-instantaneous & non-permanent bane to permanently affect the target. The bane persists indefinitely and does not allow resist rolls to end its effects. The effect can be canceled either temporarily with the nullify bane, or permanently with the Heightened Invocation feat (see the Dispel Bane entry that follows).</li><li><b>Dispel Boon</b> - Make an Entropy roll with a Challenge Rating equal to 10 + twice the power level of the boon you are attempting to dispel. If successful, you cause a permanent boon to be forever stripped from the target, causing them to lose the ability to invoke the boon automatically.</li><li><b>Dispel Bane</b> - Make a Protection roll with a Challenge Rating equal to 10 + twice the power level of the bane you are attempting to dispel. If successful, you break the curse of a permanent bane afflicting the target, though your target gains no special immunity to it.</li></ul>"
                    },
                   specialText: "Permanently bestowing banes or boons via this feat can dramatically impact the mechanical balance of a story. Just as with other permanent effects like Extraordinary Item creation, the invocation of permanent banes or boons is subject to GM's discretion, and using this feat in a way that makes one particular character overly powerful should be prohibited."
               },
               {
                   name: "Hospitaler",
                   cost: 2,
                   tiers: 1,
                   description: "Through inspiring words, magical healing, or advanced medical technique, you are exceptionally skilled at helping others shake off baneful afflictions. Paladins, bards, and combat medics are all typical examples of characters who are masters of this feat.",
                   prerequisites: {
                       1: { powerLevel: 4, attributes: ["creation", "presence", "protection"], feats: [] }
                   },
                   baseEffectDescription: "You can use a major action to give an ally an immediate resist roll (a free action for the ally) with advantage 1. Additionally, you gain advantage 1 any time you attempt to invoke the restoration boon.",
                   effects: {
                   },
               },
               {
                   name: "Impervious Trance",
                   cost: 3,
                   tiers: 1,
                   description: "In the heightened focus of battle, your will becomes indomitable. Like a monk with unflinching mental focus or a berserker who is too bloodthirsty to be stopped, you cannot be thwarted by fear, charm, or similar attempts to overcome your willpower.",
                   prerequisites: {
                       1: { powerLevel: 7, attributes: ["will"], feats: ["Battle Trance"] }
                   },
                   baseEffectDescription: "While you are in a battle trance, you are immune to banes that target your Resolve. If you were already under the effect of such a bane, it is negated for the duration of your battle trance and returns when your battle trance ends.",
                   effects: {
                   },
                  
               },
               {
                   name: "Indomitable Endurance",
                   cost: 2,
                   tiers: 5,
                   description: "Your endurance and willpower are legendary, allowing you to push on when others would keel over from exhaustion. A barbarian able to recover their wind after a mighty frenzy, or a computer hacker capable of routinely going for days without sleep while focused on a singular objective are good examples of this feat in action.",
                   prerequisites: {
                       1: { powerLevel: 5, attributes: ["fortitude", "will"], feats: [] },
                       2: { powerLevel: 5, attributes: ["fortitude", "will"], feats: [] },
                       3: { powerLevel: 5, attributes: ["fortitude", "will"], feats: [] },
                       4: { powerLevel: 5, attributes: ["fortitude", "will"], feats: [] },
                       5: { powerLevel: 5, attributes: ["fortitude", "will"], feats: [] }
                   },
                   baseEffectDescription: "You gain advantage 2 on all rolls to resist fatigue, exhaustion, and similar debilitating effects.",
                   effects: {
                       1: "Gain advantage 2 on rolls to resist fatigue and exhaustion effects."
                   },
                   specialText: ""
               },
               {
                   name: "Indomitable Resolve",
                   cost: 1,
                   tiers: 3,
                   description: "Your resolve is exceptional, making your more resilient to mental effects that would overwhelm those of lesser mettle. A keen-minded space captain and a wizened mage are both exemplars of this feat in action.",
                   prerequisites: {
                       1: { powerLevel: 3, attributes: ["presence", "will"], feats: [] },
                       2: { powerLevel: 4, attributes: ["presence", "will"], feats: [] },
                       3: { powerLevel: 5, attributes: ["presence", "will"], feats: [] }
                   },
                   baseEffectDescription: "For each tier you possess in this feat, your Resolve defense is increased by 1.",
                   effects: {
                   },
                   specialText: ""
               },
               {
                   name: "Inspiring Champion",
                   cost: 2,
                   tiers: 3,
                   description: "You fight with such bravery, heroism, or bravado that your allies are inspired to fight beyond their usual mettle. Common examples of characters who typify this feat include a shining knight, a fearless platoon leader, and a heroic bard.",
                   prerequisites: {
                       1: { powerLevel: 4, attributes: ["presence"], feats: [] },
                       2: { powerLevel: 5, attributes: ["presence"], feats: [] },
                       3: { powerLevel: 6, attributes: ["presence"], feats: [] }
                   },
                   baseEffectDescription: "Once per round, when your roll for a damaging attack exceeds an enemy's defense by 10 or more, you can grant healing to your allies as outlined below. In order to gain this healing, allies must be within a range of 5' times your Presence score.",
                   effects: {
                       1: "A single ally that can see the attack heals 1d4 HP.",
                       2: "A number of allies equal to your Presence score who can see the attack heal 1d4 HP.",
                       3: "All allies who can see the attack heal 2d4 HP."
                   },
                   specialText: ""
               },
               {
                   name: "Knowledge",
                   cost: 2,
                   tiers: 3,
                   description: "Whether through extensive study or years of first hand experience, you have knowledge of a particular subject which far surpasses your general intelligence. A navigator well versed in the galactic map, a barbarian warlord with years of experience with military strategy, and a professor of the paranormal are all examples of this feat in play.",
                   prerequisites: {
                   },
                   baseEffectDescription: "When you take this feat, choose a sphere of knowledge from the list below or, with the GM's approval, create a new one.<br>Example spheres of knowledge include alchemy, anatomy, arcane, computers, explosives, engineering, geography, herbalism, history, location (must specify), medicine, military strategy, supernatural, and wilderness.<br>Your tier in this feat determines how knowledgeable you are within your chosen sphere.",
                   effects: {
                       1: "You automatically succeed on any action roll related to your chosen sphere of knowledge with a CR of 16 or lower. For higher CRs, your Learning attribute is considered to be 3 for the action roll unless your Learning score is already 3 or higher, in which case you gain advantage 1 on the roll.",
                       2: "You automatically succeed on any action roll related to your chosen sphere of knowledge with a CR of 22 or lower. For higher CRs, your Learning attribute is considered to be 6 for the action roll unless your Learning score is already 6 or higher, in which case you gain advantage 1 on the roll.",
                       3: "You automatically succeed on any action roll related to your chosen sphere of knowledge with a CR of 26 or lower. For higher CRs, your Learning attribute is considered to be 8 for the action roll unless your Learning score is already 8 or higher, in which case you gain advantage 1 on the roll."
                   },
                   specialText: "In addition to purchasing multiple tiers of this feat, you may take this feat multiple times and select a new sphere of knowledge each time. Purchasing this feat in this way confers no benefit on other spheres of knowledge."
               },
               {
                   name: "Lethal Strike",
                   cost: 3,
                   tiers: 9,
                   description: "Like a highly trained sniper, a ninja of legend, or a feinting melee dervish, you can devastate your foes with an expertly placed attack when you catch them off guard.",
                   prerequisites: {
                       1: { powerLevel: 3, attributes: ["agility"], feats: [] },
                       2: { powerLevel: 3, attributes: ["agility"], feats: [] },
                       3: { powerLevel: 3, attributes: ["agility"], feats: [] },
                       4: { powerLevel: 5, attributes: ["agility"], feats: [] },
                       5: { powerLevel: 5, attributes: ["agility"], feats: [] },
                       6: { powerLevel: 5, attributes: ["agility"], feats: [] },
                       7: { powerLevel: 7, attributes: ["agility"], feats: [] },
                       8: { powerLevel: 7, attributes: ["agility"], feats: [] },
                       9: { powerLevel: 7, attributes: ["agility"], feats: [] }
                   },
                   baseEffectDescription: "Your attacks are considered lethal strikes whenever you fulfill one of the following conditions:<ul><li>Your target is caught off guard or otherwise unaware of the attack, such as when you are hidden from them, disguised as a friend, or have successfully deceived them.</li><li>Your target is within melee attack range of an ally.</li></ul>You gain advantage on lethal strikes equal to your tier in this feat. Additionally, a certain portion of the damage (not to exceed the total damage dealt) is considered lethal damage, which is more difficult to heal from (see Chapter 7: Combat).",
                   effects: {
                       1: "Advantage 1. Up to 5 lethal damage.",
                       2: "Advantage 2. Up to 5 lethal damage.",
                       3: "Advantage 3. Up to 10 lethal damage.",
                       4: "Advantage 4. Up to 10 lethal damage.",
                       5: "Advantage 5. Up to 15 lethal damage.",
                       6: "Advantage 6. Up to 20 lethal damage.",
                       7: "Advantage 7. Up to 20 lethal damage.",
                       8: "Advantage 8. Up to 25 lethal damage.",
                       9: "Advantage 9. Up to 25 lethal damage."
                   },
                   specialText: "Lethal damage reduces the target's maximum hit points until healed."
               },
               {
                   name: "Lightning Reflexes",
                   cost: 1,
                   tiers: 5,
                   description: "You are always ready for danger, allowing you to easily get the drop on your foes. A highly trained gunslinger with a vigilant trigger finger and a covert operative always prepared for ambush are good examples of this feat in action.",
                   prerequisites: {
                       1: { powerLevel: 2, attributes: ["agility", "prescience"], feats: [] },
                       2: { powerLevel: 2, attributes: ["agility", "prescience"], feats: [] },
                       3: { powerLevel: 4, attributes: ["agility", "prescience"], feats: [] },
                       4: { powerLevel: 4, attributes: ["agility", "prescience"], feats: [] },
                       5: { powerLevel: 4, attributes: ["agility", "prescience"], feats: [] }
                   },
                   baseEffectDescription: "For each tier you possess in this feat, you gain advantage 1 on all initiative rolls.",
                   effects: {
                     
                   },
                   specialText: ""
               },
               {
                   name: "Longshot",
                   cost: 1,
                   tiers: 1,
                   description: "Your expertise with a particular ranged weapon or extraordinary power enables you to strike targets at extreme distances that others would find impossible. This feat is common among snipers, fighter pilots, and war wizards.",
                   prerequisites: {
                       1: { powerLevel: 4, attributes: ["agility", "might", "alteration", "creation", "energy", "entropy", "influence", "movement", "prescience", "protection"], feats: [] }
                   },
                   baseEffectDescription: "When you take this feat, select one weapon or attack type. Examples of attack types you include fire, cold, lightning, acid, poison, entropy, creation, and force - though this list is not exhaustive. With the chosen weapon or attack type, your range with that weapon or attribute is doubled.",
                   effects: {
                       1: ""
                   },
                   specialText: "You may take this feat multiple times. If you do, select a new weapon or attack type each time."
               },
       
               {
                   name: "Martial Focus",
                   cost: 3,
                   tiers: 1,
                   description: "Like a kensai warrior devoted to mastery of their katana or an assassin who exclusively wields their favored pistols, your training is hyper-focused on a single style of combat to the exclusion of all others.",
                   prerequisites: {
                       1: { powerLevel: 1, attributes: ["agility", "might"], feats: [] }
                   },
                   baseEffectDescription: "Choose a single weapon (or choose unarmed combat), and specify the attribute that your martial focus relies upon: Agility or Might. When making attacks using your chosen weapon, your attribute is considered 1 greater for the purposes of determining attribute dice. Your attribute is not changed for purposes of feats, banes, boons, or similar items. Because of your intense focus on a single combat style, any attacks that you make without your martial focus suffer disadvantage 1.",
                   effects: {
                       
                   },
                   specialText: ""
               },
               {
                   name: "Master Tracker",
                   cost: 1,
                   tiers: 1,
                   description: "You were made for the hunt. Whether you gained this ability through years of practice or possess it through heightened senses, the effect is the same: once you've picked up a trail, you almost never lose track of your quarry.",
                   prerequisites: {
                       1: { powerLevel: 4, attributes: ["perception"], feats: [] }
                   },
                   baseEffectDescription: "Unless blinded or thwarted through extraordinary means, you always know the direction of true north. In addition, once you successfully locate the trail of a target, you automatically succeed at all tracking attempts to continue following that trail for 7 days after the time you first picked it up. Only extraordinary concealment, targets in flight, or similarly exceptional cases can cause you to lose your mark.",
                   effects: {
                   },
                   specialText: ""
               },
               {
                   name: "Mimic",
                   cost: 2,
                   tiers: 1,
                   description: "You have honed your shapeshifting abilities to be able to not only change your form, but to even imitate specific creatures. Your powers may stem from studying the arts of deceptive magic, from a gene mutation, or even from innate extraordinary abilities.",
                   prerequisites: {
                       1: { powerLevel: 5, attributes: ["alteration", "deception"], feats: [], attributeRequirementLogic: "and" }
                   },
                   baseEffectDescription: "When you use the <b>shapeshift boon</b>, you may take on the features of a <b>specific creature</b>.<br><br><b>Example:</b> Instead of merely transforming into an elf, you can assume the guise of Galdion the elven king.<br><br><b>Disguise Quality:</b> The disguise is near perfect for those examining you visually.<br><br><b>Detection:</b> If your behavior or other signs provide reasonable suspicion, an onlooker can attempt a Perception roll with a Challenge Rating equal to <b>10 + triple your Alteration or Deception score</b>, whichever is higher. If they succeed, they will recognize your disguise.",
                   effects: {
                      
                   },
                   specialText: ""
               },
               {
                   name: "Multi-Attack Specialist",
                   cost: 3,
                   tiers: 6,
                   description: "Whether you are delivering a flurry of blows, wielding two weapons, or calling a chain of lightning bolts from the sky, you have mastered the art of delivering multiple attacks.",
                   prerequisites: {
                       
                   },
                   baseEffectDescription: "<strong>Multi-Attack Declaration:</strong> At the start of your turn, you may declare that you are multi-attacking. You must state how many extra attacks you would like to make.<br><br><strong>Additional Actions:</strong> You receive a corresponding number of additional major actions, which can only be used for attacks.<br><br><strong>Disadvantage Penalty:</strong> All of your attacks this round suffer disadvantage equal to 3 times the number of additional attacks you declare (i.e., if you make 2 attacks, you suffer disadvantage 3; 3 attacks suffers disadvantage 6).<br><br><strong>Feat Tier Reduction:</strong> For each tier of this feat that you possess, reduce the disadvantage penalty by 1.<br><br><strong>Attack Types:</strong> You may use your attacks to make any combination of bane or damaging attacks, but you may not invoke boons.<br><br><strong>Resolution:</strong> Resolve each attack individually, applying any other multi-targeting options as you wish. You can move between each of these attacks and they can be used to target the same creature more than once.<br><br><strong>Attack Limit:</strong> The number of additional attacks you can make with this feat is limited to 1 + half your level, rounded up. Thus, the limit is 2 additional attacks at 1st level, 3 additional attacks at 3rd level, and 6 additional attacks at 9th level.<br><br><strong>Example:</strong> Vax the Deathbringer has Multi-Attack Specialist (Tier III). He declares that he will be making three attacks this round (two additional attacks). Therefore, all of his attacks suffer disadvantage 3 (3 x 2 = 6, minus 3 for feat tier 3). His first attack is a necromantic burst targeting a 10'-cube. Because of the area of effect, Vax suffers an additional disadvantage 2, making his total disadvantage for that attack 5. For his second attack, Vax casts a spell of blindness on a single foe, making an action roll at disadvantage 3. For his final attack, Vax moves in to melee and uses his touch of death on three foes. Targeting 3 foes incurs an additional disadvantage 3, making his final attack roll suffer a total of disadvantage 6.",
                   effects: {
                      
                   },
                   specialText: ""
               },
               {
                   name: "Multi-Bane Specialist",
                   cost: 3,
                   tiers: 1,
                   description: "You have mastered a signature attack that allows you to invoke two banes at once. A blast of ice that blinds and slows your enemy, a thunderous shotgun blast that hurls foes back and knocks them to the ground, and a wormtongue song that puts targets to sleep and alters their memory are all examples of a signature attack that could be created with this feat.",
                   prerequisites: {
                   },
                   baseEffectDescription: "Choose <b>two banes that you are able to inflict</b> and that share a common prerequisite attribute.<br><br><b>Single Attack:</b> You are able to inflict both banes with a single attack.<br><br><b>Attribute Requirement:</b> The required attribute score for combining the banes is equal to the sum of their power levels.<br><br><b>Example:</b> Combining knockdown and slowed, both power level 1, would require an attribute score of 2.<br><br><b>Defense Targeting:</b> If the banes target different defenses, you choose which defense your attack targets.<br><br><b>Effect:</b> On a successful attack roll, the target is inflicted with both banes. They each persist independently of one another and must be resisted separately.",
                   effects: {
                   },
                   specialText: "In order to benefit from the bane focus feat when using a multi-bane attack, you must possess bane focus for both banes. You may take this feat more than once. If you do, you must choose a different pair of banes for the new instance of the feat.",
                   customInput: true,
                   customInputLabel: "Choose Two Banes:",
                   customInputPlaceholder: "Select two banes for your multi-bane attack..."
               },
               {
                   name: "Multi-Target Attack Specialist",
                   cost: 2,
                   tiers: 5,
                   description: "You are a master of wreaking havoc on many foes at once, whether it be with a whirlwind of your twin blades, a hail of gun fire, a massive wave of psionic energy, or a devastating ball of flame.",
                   prerequisites: {
                   },
                   baseEffectDescription: "When you choose this feat, you must decide to focus in area, ranged, or melee attacks. For each tier, you reduce the disadvantage penalty associated with multi-targeting for your chosen attack type by 1.",
                   effects: {
                   },
                   specialText: "In addition to purchasing multiple tiers of this feat, you may take this feat multiple times and select a new multi-target mode (area, ranged, or melee) each time. Track your feat tier separately for each targeting mode that you select for this feat."
               },
               {
                   name: "Multi-Target Boon Expert",
                   cost: 3,
                   tiers: 1,
                   description: "You have so mastered the art of aiding groups of allies that you can invoke certain boons effortlessly. A healing nova, a supernatural wind that gives flight to a group, and a time dilation that hastens a group of allies are all examples of this feat in action.",
                   prerequisites: {
                       1: { powerLevel: 0, attributes: [], feats: ["Boon Focus", "Multi-Target Boon Specialist II"] }
                   },
                   baseEffectDescription: "When multi-targeting a boon for which you have the Boon Focus feat, you do not need to make an action roll if the disadvantage normally incurred from multi-targeting is completely negated by your Multi-Target Boon Specialist feat. Your invocation automatically succeeds.",
                   effects: {
                   },
                   specialText: ""
               },
               {
                   name: "Multi-Target Boon Specialist",
                   cost: 2,
                   tiers: 9,
                   description: "You are a master of invoking boons for more than one target. A mass dimensional shift to an intermediary plane and a mass manifestation of entropic life draining are some examples of what this might look like in play.",
                   prerequisites: {
                      
                   },
                   baseEffectDescription: "For each tier of this feat, you reduce the disadvantage penalty associated with invoking boons for multiple targets by 1.",
                   effects: {
                   },
                   specialText: ""
               },
               {
                   name: "Natural Defense",
                   cost: 2,
                   tiers: 3,
                   description: "Your natural abilities provide you with exceptional defensive capabilities, whether through thick skin, magical wards, or supernatural protection.",
                   prerequisites: {
                       2: { powerLevel: 1, attributes: ["fortitude"], feats: [] },
                       3: { powerLevel: 2, attributes: ["fortitude"], feats: [] }
                   },
                   baseEffectDescription: "When you are not wearing armor, you gain a bonus to your Guard and Toughness defenses. Your bonus is determined by your tier in this feat.",
                   effects: {
                       1: "+1 bonus to Guard and Toughness.",
                       2: "+2 bonus to Guard and Toughness.",
                       3: "+3 bonus to Guard and Toughness."
                   },
                   specialText: ""
               },
               {
                name: "Overpowering Strike",
                cost: 2,
                tiers: 1,
                description: "In combat, you are like a wrecking ball that clears the battlefield of your foes. The sheer force of your attacks is so great that you send opponents flying. A half-ogre wielding a massive tree branch and a super soldier trained to use the enemy's weight against themself are both examples of this feat in play.",
                prerequisites: {
                    1: { powerLevel: 4, attributes: ["might"], feats: [] }
                },
                baseEffectDescription: "Each time you deal damage using a weapon that has the forceful property, you can choose to push the target five feet away from you.",
                effects: {
                },
                specialText: ""
               },
               {
                   name: "Potent Bane",
                   cost: 3,
                   tiers: 1,
                   description: "You are so adept at a particular form of attack that your foes struggle to shake off the effects. Perhaps the flames of your fireballs burn hotter. Or maybe you've developed a special chemical to mix in with your blinding powder. Whatever the source and whatever the effect, most enemies are incapable of recovering from your legendary attack.",
                   prerequisites: {
                   },
                   baseEffectDescription: "Choose one bane that you can invoke that has a duration of \"resist ends\". When a target makes a resist roll to shake off your invocation of the chosen bane, they have disadvantage 1.",
                   effects: {
                      
                   },
                   specialText: "You may select this feat multiple times. Each time you take it, choose a different bane.",
                   customInput: true,
                   customInputLabel: "Choose Bane:",
                   customInputPlaceholder: "Select a bane for Potent Bane..."
               },
               {
                   name: "Reactionary Trance",
                   cost: 2,
                   tiers: 1,
                   description: "Your intense focus never lapses, allowing you to tap into your heightened battle trance at a moment's notice. Examples of this feat in play include a hulking brute who snaps into a rage at the first sign of danger and a trained gunslinger who is always ready for a fight.",
                   prerequisites: {
                       1: { powerLevel: 5, attributes: ["will"], feats: ["Battle Trance"] }
                   },
                   baseEffectDescription: "You can enter a battle trance (as per the Battle Trance feat) as a free action even when it is not your turn. You may choose to do so in reaction to another action, such as an enemy's attack, spell, or insult. You may even declare your intent to enter a battle trance after the action has been resolved (such as after the attack has already been rolled). The benefits granted from your battle trance take place before the triggering action is resolved, potentially negating damage or harmful effects that you would have otherwise incurred.",
                   effects: {
                      
                   },
                   specialText: ""
               },
               {
                   name: "Reckless Attack",
                   cost: 3,
                   tiers: 1,
                   description: "By willingly punishing your own body in the heat of battle, you launch a relentless flurry of attacks that physically drains you but devastates your foes. A super soldier activating a stim pack and a berserker pushing their muscles to the breaking point are examples of this feat in action.",
                   prerequisites: {
                       1: { powerLevel: 0, attributes: [], feats: ["Battle Trance"] }
                   },
                   baseEffectDescription: "While you are in a battle trance, on your turn you may choose to inflict 5 hit points of damage on yourself to make an attack as a minor action. Effects that prevent or reduce damage cannot affect this self-inflicted damage. You suffer the damage before making your extra attack, so you must be able to remain conscious after the damage is dealt in order to benefit from your extra attack.",
                   effects: {
                       
                   },
                   specialText: ""
               },
               {
                   name: "Resilient",
                   cost: 3,
                   tiers: 1,
                   description: "Whether through luck, extraordinary will, or exceptional courage, you are able to shake off banes quicker than others. This feat can fit almost any character concept: a halfling who always has luck shining on him, a sorceress with an aura of protection, a paladin blessed by a deity, or an absent-minded professor who has no time to let disturbances get in the way of study",
                   prerequisites: {
                       1: { powerLevel: 3, attributes: ["fortitude", "presence", "will"], feats: [] }
                   },
                   baseEffectDescription: "Any time you make a resist roll, you have advantage 1 on the roll.",
                   effects: {
                      
                   },
                   specialText: ""
               },
        
               {
                   name: "Sentinel",
                   cost: 3,
                   tiers: 3,
                   description: "Your heightened awareness on the battlefield means that you are nearly impossible to catch flat-footed and are always prepared to defend yourself or allies. This feat is typified by such character concepts as the bodyguard, the abjurer, and the psychic defender.",
                   prerequisites: {
                       1: { powerLevel: 5, attributes: ["agility", "might", "alteration", "creation", "energy", "entropy", "influence", "movement", "prescience", "protection"], feats: [] },
                       2: { powerLevel: 5, attributes: ["agility", "might", "alteration", "creation", "energy", "entropy", "influence", "movement", "prescience", "protection"], feats: [] },
                       3: { powerLevel: 5, attributes: ["agility", "might", "alteration", "creation", "energy", "entropy", "influence", "movement", "prescience", "protection"], feats: [] }
                   },
                   baseEffectDescription: "Once per round, after you have expended your next major action to perform a defend action, you get an additional major action that must be spent before the start of your next turn to make another defend action. Multiple tiers of this feat grant additional major actions usable only for defend actions.",
                   effects: {
                      
                   },
                   specialText: ""
               },
               {
                   name: "Silencing Strike",
                   cost: 3,
                   tiers: 1,
                   description: "Like an expert assassin or ninja, you can render your foes completely unable to alert others of your presence. This might take the form of a dart to the larynx, a garrote around the throat, or simply a sturdy covering of the mouth.",
                   prerequisites: {
                       1: { powerLevel: 4, attributes: ["agility"], feats: [] }
                   },
                   baseEffectDescription: "Whenever you deal damage using a weapon with the precise property to a target that is caught off guard or otherwise unaware of the attack, such as when you are hidden from them, disguised as a friend, or have successfully deceived them, the target is afflicted with the silenced bane.",
                   effects: {
                   },
                   specialText: ""
               },
               
               {
                   name: "Skill Specialization",
                   cost: 2,
                   tiers: 5,
                   description: "You have the eyes of an eagle, the endurance of an ox, the guile of a fox, or some similarly exceptional non-combat talent. It might come from intense training, prolonged study, or even an inherent natural talent.",
                   prerequisites: {
                      
                   },
                   baseEffectDescription: "Choose one attribute. Any time you make a roll using the chosen attribute that is not for initiative, attacks, invocations, or the defend action, you gain advantage 1 on the roll per tier of this feat you possess for that attribute.",
                   effects: {
                   },
                   specialText: "In addition to purchasing multiple tiers of this feat, you may take this feat multiple times and select a new attribute each time. Track your feat tier separately for each attribute that you choose for this feat.",
                   customInput: true,
                   customInputLabel: "Choose Attribute:",
                   customInputPlaceholder: "Select an attribute for Skill Specialization..."
               },
               {
                   name: "Superior Concentration",
                   cost: 3,
                   tiers: 3,
                   description: "Your powers of focus are exceptionally honed, allowing you to maintain concentration on multiple extraordinary effects at once. This feat is typical among character concepts built to enhance themselves or their allies, such as bards, platoon leaders, or engineers.",
                   prerequisites: {
                       
                   },
                   baseEffectDescription: "When you take the sustain a boon minor action, you may sustain one additional boon per tier of this feat which you possess.",
                   effects: {
                       
                   },
                   specialText: ""
               },
               {
                   name: "Swimming",
                   cost: 1,
                   tiers: 1,
                   description: "You are made for the water and can swim at surprising speeds with the aptitude of a fish. This might be the result of hard core training, or it may stem from a racial trait, such as webbed feet and hands.",
                   prerequisites: {
                       1: { attributes: {}, feats: [] }
                   },
                   baseEffectDescription: "You gain a swimming speed equal to your base speed and do not need to make any special action rolls to maintain this base speed.",
                   effects: {
                      
                   },
                   specialText: ""
               },
               {
                   name: "Sworn Enemy",
                   cost: 1,
                   tiers: 9,
                   description: "You are expertly focused on dealing with a particular species, race, or faction. Perhaps your family was slain by werewolves, and you have devoted your life to studying their mannerisms in order to hunt them down. Or maybe you were raised in a prison on the third moon of Vogax Prime, and you know the Vogans better than they know themselves.",
                   prerequisites: {
                      
                   },
                   baseEffectDescription: "Choose a species, race, or faction (e.g., dragons, Void Templars, gnolls, or vampires). You learn the primary conversational language of that species, and at the GM's discretion, you may have some level of access to other special forms of communication (such as thieves' cant or secret hand signals). Furthermore, you gain advantage 1 per tier of this feat to all Mental attribute rolls (Learning, Logic, Perception, and Will) pertaining to your chosen group.",
                   effects: {
                   },
                   specialText: "In addition to purchasing multiple tiers of this feat, you may take this feat multiple times and select a new group each time. Your total advantage on Mental attribute rolls is equal to your tier for that particular group.",
                   customInput: true,
                   customInputLabel: "Enemy Type:",
                   customInputPlaceholder: "Enter the species, race, or faction (e.g., dragons, Void Templars, gnolls, vampires)..."
               },
               {
                   name: "Tough as Nails",
                   cost: 2,
                   tiers: 2,
                   description: "You have a remarkable ability to shrug off pain and punishment that would take down lesser heroes. This power might stem from your rocky carapace, extreme combat training, or simply an extra dose of grit that you acquired from a hard life.",
                   prerequisites: {
                       1: { powerLevel: 3, attributes: ["fortitude"], feats: [] },
                       2: { powerLevel: 5, attributes: ["fortitude"], feats: [] }
                   },
                   baseEffectDescription: "You permanently gain 5 extra hit points per tier of this feat you possess.",
                   effects: {
                      
                   },
                   specialText: ""
               },
               {
                   name: "Two Weapon Brute",
                   cost: 3,
                   tiers: 1,
                   description: "Being both physically powerful and incredibly agile, you are able to wield a weapon in one-hand that requires two hands for others. Good examples of this feat in action include an orcish barbarian wielding a great axe and shield and a survivor in the zombie apocalypse wielding two chainsaws.",
                   prerequisites: {
                       1: { powerLevel: 4, attributes: ["agility", "might"], feats: ["Multi-Attack Specialist"], attributeRequirementLogic: "and" }
                   },
                   baseEffectDescription: "You can wield weapons with the two-handed property in one hand and you gain the benefits of both the two-handed and one-handed property while doing so. This means that you gain a total of advantage 2 when wielding a two-handed weapon in each hand, advantage 1 from the power of a two-handed weapon plus advantage 1 from having one weapon in each hand.",
                   effects: {
                      
                   },
                   specialText: ""
               },
               {
                   name: "Two Weapon Defense",
                   cost: 2,
                   tiers: 1,
                   description: "Your mastery of two weapon fighting allows you not only to come at your foes with a flurry of attacks, but also to shield yourself exceptionally well by deflecting incoming attacks with your weapons. Duelists, rangers, and space pirates are all concepts that could make use of this feat.",
                   prerequisites: {
                       1: { powerLevel: 4, attributes: ["agility"], feats: ["Attack Specialization"] }
                   },
                   baseEffectDescription: "When you wield a weapon you've taken the Attack Specialization feat for in each hand, you gain a +1 armor bonus to your Guard defense.",
                   effects: {
                      
                   },
                   specialText: ""
               },
               {
                   name: "Unending Charm",
                   cost: 3,
                   tiers: 1,
                   description: "Whether you are an enchanter, psychic, or mad scientist, you have mastered the art of enthralling others. Your charms are so potent that your victims may fall permanently under your compulsion.",
                   prerequisites: {
                       1: { powerLevel: 4, attributes: ["influence"], feats: [] }
                   },
                   baseEffectDescription: "When you invoke the charmed bane, targets who do not make their resist roll within 24 hours of being afflicted become permanently affected by the bane. They do not receive any more resist rolls to shake themselves free of the effect. Other extraordinary effects like a nullify bane can still end the effect (and other methods may work at the GM's discretion).",
                   effects: {
                       
                   },
                   specialText: ""
               },
               {
                   name: "Untrackable",
                   cost: 1,
                   tiers: 1,
                   description: "Whether this power manifests itself as vines that grow in your wake, a magical ward against detection, or an illusory veil, the effect is the same: you are protected from being tracked.",
                   prerequisites: {
                       1: { powerLevel: 3, attributes: ["agility", "alteration", "influence"], feats: [] }
                   },
                   baseEffectDescription: "Your travel is veiled by special means that conceal your tracks and any evidence of your passage even after you are far away. It is impossible to follow your tracks except by extraordinary means.",
                   effects: {
                       1: ""
                   },
                   specialText: ""
               },
               {
                   name: "Vicious Strike",
                   cost: 2,
                   tiers: 1,
                   description: "Whether through brute force, lethal precision, or volatile magic, a deadly attack delivered by you is exceptionally vicious. Berserkers, assassins, and superheroes of exceptional combat skill are all good examples of this feat in play.",
                   prerequisites: {
                      
                   },
                   baseEffectDescription: "Any time you roll a natural 20 on the d20 for an attack action roll, you get advantage 1 on all subsequent d20 re-rolls granted by dice explosions.",
                   effects: {
                      
                   },
                   specialText: ""
               },
               {
                   name: "Wealthy",
                   cost: 3,
                   tiers: 1,
                   description: "Whether you were born into nobility, come from old money, are heir to a great treasure, or simply a well-established merchant, you are wealthier than the average adventurer.",
                   prerequisites: {
                      
                   },
                   baseEffectDescription: "Your wealth score is increased by 1.",
                   effects: {
                      
                   },
                   specialText: ""
               },
               {
                   name: "Well-Rounded",
                   cost: 2,
                   tiers: 1,
                   description: "You have a versatile education, a wide range of experiences, or just plain old good luck. The result is that you're pretty good at things you're not specialized in.",
                   prerequisites: {
                       
                   },
                   baseEffectDescription: "Any time you use an attribute with a score of 2 or less to make an action roll outside of combat that is not a bane or boon invocation, you gain advantage 1 to the roll.",
                   effects: {
                      
                   },
                   specialText: ""
               }
          ],

    // PERKS - Positive character traits
    perks: [
        {
            name: "Ageless",
            description: "Whether you are an android constructed of spaceage material that does not erode over time, the loyal servant of a higher power, or the subject of an arcane ritual, you have unlocked the secret to immortality. You are immune to the passage of time and the effects of old age. Your body does not age and you cannot be harmed by extraordinary effects that cause aging.",
            effect: "Based on the source of your agelessness, you can decide whether or not your appearance changes over time."
        },
        {
            name: "Artisan",
            description: "Choose a specific craft, such as gunsmithing, hardware assembly, glass blowing, or brewing. You are a master of a chosen craft, and your reputation goes far and wide. In a time frame decided by the GM, you can craft any mundane item of wealth level 2 or less, if you have access to the right tools. Furthermore, whenever you are performing a task in which your crafting skills would play a role, you gain advantage 1 to any action rolls that you must make. Your reputation means that other students of your craft may actively seek you out as a teacher.",
            effect: "Experts in any field that makes use of the items you create will actively recommend that others seek you out."
        },
        {
            name: "Ascetic",
            description: "You are well-versed in the art of living with less. Whether a cloistered monk, a transcendent psion, or a wizened sage who spent years locked away in a tower of books, you are experienced at going long stretches of time with very little food, water, or company - and as such, these situations tend not to affect you as they do others. ",
            effect: "You are hardened against physical and mental deprivation and have developed an enviable degree of self-mastery."
        },
        {
            name: "Attractive",
            description: "When it comes to physical appearance, you're an absolute knockout. This plays to your favor more than just romantically, and your good looks tend to help you out in all sorts of social situations.",
            effect: "Whenever your attractiveness would play a role in a situation, you gain advantage 1 to any relevant action rolls."
        },
        {
            name: "Brute",
            description: "While others might convince with a silver tongue, you speak the universal language of fear. Once per game session, if you make a show of physical force, you can use your Might attribute for a Persuasion roll.",
            effect: "If your Persuasion score is already equal to or greater than your Might score, you get advantage 1 on the roll."
        },
        {
            name: "Courageous",
            description: "When the odds are stacked against you, you never falter or waiver.",
            effect: "Once per game session, as a free action you can cancel all negative effects upon you related to fear or low morale."
        },
        {
            name: "Crowd Favorite",
            description: "Whether you are an actor, musician, storyteller, magician, or some other type of performer, the common folk love your work.",
            effect: "They adore you for your ability to use your art to transport them to a world beyond their daily drudgery, and you can always find a place to perform and make money at the local tavern or inn."
        },
        {
            name: "Disease Immunity",
            description: "You are immune to natural disease.",
            effect: "This protection does not guard against supernatural curses such as lycanthropy."
        },
        {
            name: "Divine Agent",
            description: "You serve a higher being and have earned their protection.",
            effect: "Once per game session, when you are subject to a Finishing Blow while your hit points are below 1, you automatically heal to a hit point total of 1."
        },
        {
            name: "Divine Insight",
            description: "You possess a supernatural connection to a deity, demi-god, or other divine being which grants you otherworldly insight. Once per game session, you can choose a topic relevant to the story. The GM shares some information about that topic which might be useful.",
            effect: "If you've just failed a Learning attribute roll and use this ability, the GM decides whether to give you information related to that roll or to give you knowledge that is completely unrelated."
        },
        {
            name: "Ear of the Emperor",
            description: "You have done something in the past to earn the favor of someone in a high place: a senator, the general of an army, a merchant lord, etc. Perhaps you saved their life or spared them from significant monetary loss. Whatever you did, they owe you, and they are willing to help you with minor favors as long as the favors do not subject them to any risk or cost. Once during the campaign, you can call in a large favor that does put your contact in risk or cost them something significant.",
            effect: "They will perform the favor, but you immediately lose this trait, as their debt has been repaid."
        },
        {
            name: "Extraordinary Presence",
            description: "Your inherent extraordinary nature manifests itself in a tangible way of your choosing. For example, your eyes may glow, your skin might emanate an icy chill, or a trail of withering plants could follow you wherever you tred. Depending on the nature of your extraordinary presence, it might make others more likely to fear, admire, or trust you–or otherwise alter their initial perceptions of you.",
            effect: "Whenever your extraordinary presence is relevant in a social situation, you gain advantage 1 on any action rolls you make."
        },
        {
            name: "Fugitive",
            description: "You are part of a criminal network, whether it be a thieves' guild, band of smugglers, or otherwise. Once per game session, you can call in a favor from a contact within your network to perform a mundane task such as gathering information or arranging safe passage.",
            effect: "If the favor puts your contact at risk, they will still perform it but may ask for an equally risky favor from you in return."
        },
        {
            name: "Idol",
            description: "Your reputation for some outstanding virtue precedes you, and people tend to hold you in high esteem.",
            effect: "Once per session, you can call upon your reputation to inspire trust from someone who is skeptical of you, your actions, or your allies."
        },
        {
            name: "Innocent",
            description: "Whether from a distant fey ancestry or simply an air of naivety, you possess a childlike quality that can melt even the coldest of hearts. Once per game session, you can leverage your innocence to turn an enemy and cause them to take pity on you.",
            effect: "The enemy might choose to look the other way when you've done something illegal, forgive a debt you could never pay, or vouch in your favor before the authorities."
        },
        {
            name: "Jack of All Trades",
            description: "You have a knack for picking up new skills.",
            effect: "Once per game session, provided you are not under pressure from an inordinately tight deadline, you can automatically succeed at a non-attack action roll that relates to some craft, trade, skill, or similar work provided its Challenge Rating is less than or equal to 14"
        },
        {
            name: "Legendary Bloodline",
            description: "Your ancestry can be traced to dragons, Void Templars, an ancient order of Archmagi, a intergalactic dynasty, or a similar powerful group. As such, a sense of awe follows you when in the presence of those who respect your heritage. Choose an area of expertise, such as arcana, politics, or warfare. You are assumed to have knowledge and a destiny for greatness in the chosen area of expertise, and others treat you with deference. ",
            effect: "This influence could guarantee your placement within an Arcane College, grant you access to the Void Templars securely encrypted database, secure a mentorship under a famous Senator, or cause a Lieutenant who does not know you well to take combat orders from you based on your training in an elite task force."
        },
        {
            name: "Local Hero",
            description: "You are well-known and respected as a protector of the common folk in a small region. The average citizen look up to you, and will offer you food, shelter, and other necessities.",
            effect: "They will even take risks or assume minor costs to aid or protect you, so long as the risk is not death."
        },
        {
            name: "Lucky",
            description: "Once per game session, in a moment of need, you can call on luck to shine upon you. The GM decides what form this luck takes.",
            effect: "For example, an attack that was meant for you might target an ally instead, you may discover a secret passage to escape from a rolling boulder, or a local law enforcement officer decides to overlook your crime because you happen to have grown up on the same street."
        },
        {
            name: "Merchant",
            description: "You know the art of economics as well as the best of businessmen. A master of supply and demand, you have a knack for knowing when to buy and when to sell. You cannot be swindled when it comes to bartering, and you always know whether or not you are getting a fair price.",
            effect: "Furthermore, you have friends in merchant circles and guilds in your home city, and you can easily gain them in new locations."
        },
        {
            name: "Nature's Ally",
            description: "The natural world responds to your deep connection with it. Perhaps you are a preservationist, seeking to restore organic life in a shattered post-apocalyptic wasteland, or maybe you are a hermit closely attuned to the animals and plants of the Sylvan woodlands. Whatever your circumstance, people and creatures of your land can sense your deep respect for the natural order.",
            effect: "Wild animals are more receptive to your desires, primitive tribes give you the benefit of the doubt by assuming you do not have destructive intentions, and you can typically gain an audience with an elusive Druid or Shaman in a given region who shares your goal in defending nature."
        },
        {
            name: "Observant",
            description: "Your keen senses allow you to notice details that others typically miss. Once per game session, you can use this ability to notice something out of the ordinary. For example, you might spot a hidden passage behind a bookcase, a trace of blood under the fingernails of another character, or a wig that is not quite convincing.",
            effect: "If you use this ability after failing a Perception roll, the GM decides whether you notice the initial target of your roll or a different detail."
        },
        {
            name: "Profession",
            description: "Choose a specific trade, such as sailor, soldier, or miner. You know everything there is to know about the business and are a master of the requisite skills. A sailor, for example, can tie a knot for all occasions, navigate by the stars, and man any station aboard a ship. A soldier is well-versed in a variety of arms, understands military tactics, and knows how to navigate the chain of command with ease.",
            effect: "Furthermore, whenever you are performing a task in which your professional skills would play a role, you gain advantage 1 to any non-combat action rolls that you must make."
        },
        {
            name: "Pure-hearted",
            description: "Any goodly-natured creature you encounter is friendly toward you by default rather than neutral.",
            effect: "Circumstances can alter this, but even if rumors or actions you've taken would influence a good creature negatively, it remains one step friendlier than it otherwise would have been."
        },
        {
            name: "Resilient",
            description: "You are exceptionally difficult to kill or wear down.",
            effect: "Once per game session, you can automatically succeed a Fortitude action roll of Challenge Rating less than or equal to 10 + twice your Fortitude score."
        },
        {
            name: "Scavenger",
            description: "You have lived a life of need, and thus know how to make do when others would go without. Once per game session, you can easily acquire a single mundane item even though it would otherwise take time to get or be completely unattainable. Depending on the circumstances, the GM may decide that your acquisition is only temporary or subject to reasonable conditions.",
            effect: "For example, you might use this perk to acquire a rope in the middle of a desert, but the GM may rule that it is so sun-baked and ancient that it will likely snap after a few uses."
        },
        {
            name: "Scent",
            description: "Your sense of smell is almost feral or otherwise ultra-heightened. As a focus action, you can discern the number and relative location of living creatures within 60'. With an additional focus action you can lock onto a particular scent and maintain its relative location as long as it remains within 60'.",
            effect: "Furthermore, you gain advantage 1 on attempts to track a creature if it has left a scent trail."
        },
        {
            name: "Scholar",
            description: "You have spent years studying a particular discipline, such as physics, herbalism, dragon lore, history, politics, or religion. Once per session, you can re-roll a failed Learning roll related to your discipline, gaining advantage 2 on the re-roll.",
            effect: "Furthermore, you have colleagues and connections within your discipline, and know the proper channels for gaining access to specialty laboratories, libraries, temples, or other collections of lore related to your field of scholarship."
        },
        {
            name: "Silver Tongue",
            description: "You have practiced the ways of sneaking hidden charms and subliminal messages within everyday conversation.",
            effect: "Once per session, when you converse with an intelligent creature for at least five minutes, you will learn one useful secret of the GM's choosing about the creature."
        },
        {
            name: "Stone Sense",
            description: "While underground you may fail to find what you're looking for, but you can never be truly lost. You can always find your way back to the entrance through which you entered.",
            effect: "Furthermore, you have advantage 1 on any action rolls in which a familiarity with underground environments would prove helpful, such as attempts to identify the risk of a cave in or to find a secret passage within a cavern."
        },
        {
            name: "Street Rat",
            description: "You were raised on the streets or at least spent a good deal of time crawling about them. As such, you know how to navigate urban areas quickly, make yourself unseen, and find a bite to eat when you're down on your luck.",
            effect: "As one of the invisible urchins that crawl the city, you are also quite adept at picking up rumors in taverns and crowded streets."
        },
        {
            name: "Upper Class",
            description: "Being of high birth, old money, or otherwise given access to resources beyond the common citizen, you are treated as a benefactor by the lower classes. They will trust and help you in the hopes of being rewarded for their efforts. You are also treated as a peer by those of similar or slightly higher social standing and can typically request an audience with them.",
            effect: "In addition, representatives of the law generally assume you to be beyond reproach unless they are presented with compelling evidence to the contrary."
        },
        {
            name: "Vagabond",
            description: "Having spent significant time fending for yourself in the wilderness, you excel at surviving and navigating in the wild.",
            effect: "You always know the direction of true north and you can automatically find enough food to feed yourself plus a number of additional people equal to your Learning attribute score."
        },
        {
            name: "Warrior's Code",
            description: "As a veteran warrior, you command respect even from foes. Once per session, you can use this ability to cause an enemy or group of enemies to extend special concessions or favorable treatment toward you via an unspoken warrior's code. The GM decides what these concessions look like.",
            effect: "For example, your enemies might choose to trust you to come quietly and not shackle you, or overlook an insult that would have otherwise have been cause for bloodshed."
        },
        {
            name: "Whisperer of the Wild",
            description: "Once per game session, you can ask a single 'yes' or 'no' question of a plant or animal within earshot. The plant or animal automatically trusts you at least enough to answer the question truthfully.",
            effect: "You receive the answer by way of an inner sense, and so this ability cannot be used for further two-way communication."
        }
    ],

    
    // FLAWS - Negative character traits
    flaws: [
        {
            name: "Absent-minded",
            description: "You live with your head in the clouds. You might just be ditzy, or maybe you just spend your time contemplating loftier matters. Whatever the source of your absent-mindedness, you are slow to notice important details and have a tendency to get distracted at exactly the worst possible moment."
        },
        {
            name: "Addiction",
            description: "The roll of the dice, the smoke of the Black Lotus, or the escape of the virtual reality machine. Whether your addiction is physical, mental, or social, the effect is generally the same: you've got an itch that you need to scratch, and you'll sometimes do reckless or atrocious things to make sure that you can get your fix. You get to decide the nature and severity of your addiction."
        },
        {
            name: "Ambitious",
            description: "You are willing to do anything to get ahead in life and often that means trampling upon other people on your way to the top. When presented with a situation requiring empathy for those beneath you, it's typical for you to ignore their need. In addition, you may sometimes overreach in your attempts to get ahead, making bold and risky choices that can put you and those close to you in danger."
        },
        {
            name: "Bloodlust",
            description: "Battle isn't just a way of life, it is the way of life. There isn't a conflict you've encountered that wasn't best solved with steel, and your allies will have a hard time convincing you otherwise. You are prone to starting fights when they aren't necessary and prolonging them even after the enemy has surrendered."
        },
        {
            name: "Brash",
            description: "You are bold and daring to the point of recklessness. You have no time for plans, calculations, or strategic thinking. A lot of brass and a bit of luck are all you need. Kick in the door and let the details sort themselves out."
        },
        {
            name: "Bravado",
            description: "You have a flair for the dramatic, and will often undertake bold or daring maneuvers simply for the thrill of it. For example, in combat you might swing from a chandelier even if it offers no tactical advantage."
        },
        {
            name: "Cosmetic Deformity",
            description: "Something about you makes you less attractive, undesirable to behold, or even just downright abominable. You get to decide the nature and severity of your deformity. Examples include a scarred cheek, vacant white eyes, a burn-covered body, and a missing nose. Whatever form this flaw takes, it is merely cosmetic and thus will generally only affect you in social situations."
        },
        {
            name: "Compulsion",
            description: "You have an irresistible urge to perform a behavior of your choice. Examples include, grinding your teeth, tapping your foot, biting your fingernails, counting coinage, and washing your hands. Your compulsion can sometimes put you in awkward or embarrassing situations, such as needing to wash your hands immediately after shaking hands with an ambassador."
        },
        {
            name: "Cowardly",
            description: "You have honed self-preservation into a way of life, and you will do almost anything to avoid danger, pain, and death. Sometimes, the situation at hand and the pumping of adrenaline will lead you to perform acts that appear courageous, but sooner or later your cowardly nature will emerge. You are easy to intimidate and you will almost assuredly crack under interrogation. In combat, you can still choose to fight, but you will attempt to distance yourself as much as possible from harms way, even if it means leaving an ally in a tough spot."
        },
        {
            name: "Dimwitted",
            description: "You aren't the sharpest tack in the box. It's not just that you weren't gifted with skill in academia, it's that you pick up on things pretty slowly overall. With the exception of your areas of expertise, you have a hard time learning new skills, following instructions, and maybe even remembering names."
        },
        {
            name: "Disabled",
            description: "You have some physical deficiency that holds you back in life. You decide the nature and severity of your disability. Some examples of disabilities include blindness, deafness, missing limbs, partial paralysis, bone deficiencies, or allergies."
        },
        {
            name: "Greedy",
            description: "You can't help it: you just like things. Money, gems, items of power - they beckon you at every turn and you'll often take great risks and maybe even betray your allies if the monetary reward is great enough. You're easy to bribe, and you will often push the limits of negotiation or bartering in order to increase your share in the profits, even if it makes you a few enemies."
        },
        {
            name: "Honest",
            description: "You won't tell a lie or engage in deceitful speech, even to save your own life or the life of another."
        },
        {
            name: "Hot Tempered",
            description: "Your fuse is short and your explosions are destructive. Sometimes your anger boils slowly over time and other times it erupts completely unexpectedly. But when you do fly off the handle, things rarely go well for you."
        },
        {
            name: "Illiterate",
            description: "You can't read or write, even in languages that you speak fluently."
        },
        {
            name: "Literal Minded",
            description: "You struggle with concepts and turns of phrase that are not literally true, such as idioms and metaphors. You might think sorcery is afoot if someone tells you it is “raining cats and dogs”. If a friend exaggerated by saying “I'd kill myself if Melzak were elected Supreme Justice”, you would be genuinely concerned for your friend's life if Melzak did get elected."
        },
        {
            name: "Mood Disorder",
            description: "You suffer from a psychological condition that directly affects your mood, such as depression or anxiety. You get to determine the nature and severity of your mood disorder."
        },
        {
            name: "Naive",
            description: "Whether you are innocent, uninformed, or inexperienced, the results are the same: you are pretty gullible. You get to define the scope of your naivety. For example, maybe you're a greenhorn from a big city on the east coast, so you are unlearned in the ways of the Wild West. Or maybe your memory was completely wiped out a few weeks ago and you are relearning the rules of civilization, thus your naivety presents itself much more universally."
        },
        {
            name: "Overt",
            description: "You have a strong aversion to subterfuge, legerdemain, and smooth talking. After all, the shortest distance between two points is a straight line, so why not follow the straight and narrow path? Your overtness may lead to you mistakenly foil the plans of allies, such as by blurting out a sensitive truth in the midst of a tense negotiation."
        },
        {
            name: "Overweight",
            description: "You are carrying a few extra pounds, and they tend to get in the way at all the wrong times, such as when climbing a ladder or crossing a decrepit rope bridge."
        },
        {
            name: "Pacifist",
            description: "You disdain combat and bloodshed of any kind, and will generally do whatever possible to avoid it. You can decide the extent of your pacifism. You might just revert to violence as a last resort, or you may be so averse to combat that you won't lift a weapon even in defense of yourself or others."
        },
        {
            name: "Phobia",
            description: "You are terrified and incapable of rational thought when you are presented with the object of your fear. It could be spiders, snakes, closed spaces, crowds, or something less common like co-dependence, a fear of being alone that causes you to always seek out companionship, even if that companionship has a negative impact on your life overall."
        },
        {
            name: "Proud",
            description: "Some call it an inflated ego. Others call it conceit. But you know that you really are just that good. The rabble are inferior, and you're not afraid to let them know. Your pride may be a universal sense of self-worth, or it may only manifest itself within certain spheres or situations. For example, your rank in the Royal Star Force leads you to look down upon anyone trained in less illustrious armed forces."
        },
        {
            name: "Psychotic",
            description: "You are severely mentally deranged to the extent that you occasionally lose touch with reality. You get to determine the extent and nature of your psychosis, including any potential triggers. For example, you might believe that beings from another dimension are trying to abduct you, or perhaps you relive a nightmarish scene from your past whenever you are in the midst of a gun fight."
        },
        {
            name: "Short-winded",
            description: "You have poor lung capacity and easily tire. Sprints, long runs, and forced marches are either impossible for you or they tend to leave you completely incapacitated afterwards."
        },
        {
            name: "Sick",
            description: "You suffer from some sort of chronic illness or condition, such as tuberculosis, cancer, arthritis, or irritable bowel syndrome. Even if you possess the means to treat your disease or control the symptoms, you might still have episodes or flare ups that hinder your adventuring life."
        },
        {
            name: "Socially Awkward",
            description: "Something about your behavior tends to rub people the wrong way. Perhaps you don't respect the personal space of others, you tend to ramble in conversation, or share overly personal details. Whatever the nature of your awkwardness, it makes social situations difficult for you at times."
        },
        {
            name: "Stubborn",
            description: "It's your way or the highway. Maybe not all of the time, but once you've made your mind up on an important matter, you won't budge. You probably won't even compromise."
        },
        {
            name: "Uncoordinated",
            description: "Your body just doesn't work well with itself. You have trouble balancing, catching, throwing, and performing similar physical tasks that require dexterity or nimbleness."
        },
        {
            name: "Vengeful",
            description: "You let no slight go unpunished. While some might be able to shake off an insult from a tavern drunk, you take it as a personal assault that demands satisfaction. The more severe the crime, the greater the vengeance you will mete out."
        },
        {
            name: "Zealous",
            description: "You stand for a cause - whether it is a religion, a nation, a code, a way of life, or otherwise - and you will push the boundaries of normal behavior to uphold your cause. This might mean that you make yourself a social outcast by attempting to convert others to your cause, or it could mean that you are willing to perform an act you might otherwise consider evil, such as putting innocent lives in danger, if doing so would promote your cause."
        }
    ],


    // BASE ACTIONS - Common actions available to all characters
    baseactions: [
        // MAJOR ACTIONS - Once per Round on your Turn
        {
            baseActionName: "Damaging Attack",
            actionDuration: "Major Action",
            description:"A damaging attack is one in which you are strictly aiming to reduce your foe’s hit points. When you want to attack a target, follow these steps: <br><b>Determine attribute vs. defense.</b> Every attack consists of a single attribute roll that is compared to one of the target’s defenses.<br><b>Choose your target.</b> The range of your attack depends on whether you are using a melee, ranged, or non-physical attack.<br><b>Roll your attack.</b> Make an attribute roll. You deal damage equal to the amount that your roll exceeds your target’s defense. If you meet or exceed the target's defense, you deal a minimum of three damage."
         },
	{
            baseActionName: "Bane Attack",
            actionDuration: "Major Action",
            description: "Instead of attempting to damage a target, you may instead choose to inflict your enemy with a bane. In order to inflict a bane, you must possess an appropriate attribute of at least the bane's power level, as detailed in the bane descriptions. While targets may be affected by multiple different banes, you may not stack banes. That is, a target cannot be inflicted with a bane it is currently suffering from, unless specified in the bane's effect (e.g. fatigued).<br>Resolving a bane attack is very similar to making a damaging attack, except as indicated in these steps:<br><b>Determine attribute vs. defense.</b> The bane descriptions indicate which attributes you can use to inflict a bane as well as the targeted defense.<br><b>Choose your target.</b> Choosing targets and determining range for bane attacks is identical to the process for damaging attacks, including multi-targeting options. Note that banes invoked with Agility or Might require a weapon or natural attack, and are thus limited by the range of the attack.<br><b>Roll your attack.</b> Make an action roll using the appropriate attribute. If your total equals or exceeds the target's defense score, your target suffers the bane."
        },
	{
            baseActionName: "Invoke a Boon",
            actionDuration: "Major Action",
            description: "You can invoke boons in order to aid yourself or allies. In order to invoke a boon, you must possess an appropriate attribute of at least the boon's power level. To invoke a boon, follow these steps:<br><b>Choose your target.</b> Choosing targets and determining range for boon invocations is identical to the process for damaging attacks, including multi-targeting options. If you later sustain this boon, that use of the sustain action persists the boon for all targets affected by the original invocation.<br><b>Roll to invoke.</b> Make an action roll using the appropriate attribute, as determined by the boon descriptions.<br><b>Determine power level.</b> Some boons only possess a single power level, while others can be invoked at multiple power levels. The Challenge Rating to meet a Power Level, is 10 + (PL*2). Regardless of your roll, you cannot invoke a boon at a power level greater than the attribute you are using to invoke the boon. If you fail to meet the Challenge Rating of your boon's lowest power level, your invocation fails."
        },
	{
            baseActionName: "Assist an Ally",
            actionDuration: "Major Action",
            description: "You can use your major action to assist an ally with an action roll if they are using an attribute you have a score of 1 or greater in. The ally automatically gets advantage 1 on their roll."
        },
	{
            baseActionName: "Take an Extra Move Action",
            actionDuration: "Major Action",
            description: "On any turn, instead of taking a major action, you may use an extra move action."
        },
	{
            baseActionName: "Hospitaler Aid",
            actionDuration: "Major Action",
            description: "You can use a major action to give an ally an immediate resist roll (a free action for the ally) with advantage 1. This action allows you to help an ally shake off baneful afflictions through inspiring words, magical healing, or advanced medical technique."
        },
        
        // MOVEMENT ACTIONS - Once per round on your Turn
        {
            baseActionName: "Move Your Speed",
            actionDuration: "Movement Action",
            description: "You move up to your movement speed. This can be broken up throughout your turn and combined with other actions."
        },
        {
            baseActionName: "Take Special Movement",
            actionDuration: "Movement Action",
            description: "Special movement includes climbing, jumping, swimming, and other movement that is typically more restricted than just running across the battlefield."
        },
        {
            baseActionName: "Jump",
            actionDuration: "Movement Action",
            description: "Make a Might roll. You can move up to 10’ for free as a running start before jumping. If you do, you get advantage 1 for every 10' by which your speed exceeds 30'.<br><b>For a long jump</b>, you cover a number of feet equal to your roll.<br><b>For a high jump</b>, you cover a number of feet equal to your roll divided by 2."
        },
        {
            baseActionName: "Get down to or up from prone",
            actionDuration: "Movement Action",
            description: "This requires a move action and costs a character half (round down) of their speed for the round."
        },
        {
            baseActionName: "Resist Banes",
            actionDuration: "Movement Action",
            description: "You can use a move action to recover from one or more banes afflicting you. This move action cost is a simplified way of representing any number of different ways you might go about shaking off the wide range of banes you might be afflicted by. Roll 1d20 (with no attribute modifiers). If your roll is a 10 or higher, the bane is removed. Note that some banes have different rules for how they can be resisted.<br>Many banes will persist for a longer duration after three failed resist attempts to shake them off. As such, you should keep a tally of any banes which you fail to resist."
        },
        
        // FOCUS ACTIONS - You focus your turn on only one action
        {
            baseActionName: "Superior Action",
            actionDuration: "Focus Action",
            description: "Make any one action roll with advantage 1."
        },
        {
            baseActionName: "Charge",
            actionDuration: "Focus Action",
            description: "Move up to twice your speed and make one melee attack at disadvantage 1."
        },
        
        // MINOR ACTIONS - Each one may be used per round each
        {
            baseActionName: "Draw Weapon",
            actionDuration: "Minor Action",
            description: "You draw a weapon out of your inventory"
        },
        {
            baseActionName: "Sheath Weapon",
            actionDuration: "Minor Action",
            description: "You put your weapon back into your inventory"
        },
        {
            baseActionName: "Retrieve Item On Your Person",
            actionDuration: "Minor Action",
            description: "You take an item out of your inventory"
        },
        {
            baseActionName: "Sustain a boon",
            actionDuration: "Minor Action",
            description: "Many boons have a default duration of 'Sustain Persists', which means that every time a character uses the sustain a boon action, the boon remains in effect for 1 additional round. If you have a boon in effect and do not sustain it, the boon ends when your turn is over."
        },
        {
            baseActionName: "Perception Roll to Observe Surroundings",
            actionDuration: "Minor Action",
            description: "You make a perception roll to observe your surroundings"
        },
        {
            baseActionName: "Learning Roll to recall information",
            actionDuration: "Minor Action",
            description: "You make a learning roll to recall some information"
        },
        {
            baseActionName: "Open a door, chest, drawer, etc.",
            actionDuration: "Minor Action",
            description: "You interact with one hindrance to open or close it"
        },
        {
            baseActionName: "Make an Opportunity attack with Melee Weapon",
            actionDuration: "Minor Action",
            description: "You may attack an enemy that you see is voluntarily moving out of your melee range. This is a special minor action, as it usually happens during an enemy's turn."
        },
        {
            baseActionName: "Miscellaneous Actions Determined By DM",
            actionDuration: "Minor Action",
            description: "Ask your GM to make a specific action, that most likely doesn't include an attack or invocation"
        },
        {
            baseActionName: "Reckless Attack",
            actionDuration: "Minor Action",
            description: "While you are in a battle trance, on your turn you may choose to inflict 5 hit points of damage on yourself to make an attack as a minor action. Effects that prevent or reduce damage cannot affect this self-inflicted damage. You suffer the damage before making your extra attack, so you must be able to remain conscious after the damage is dealt in order to benefit from your extra attack."
        },
        
        // INTERRUPT ACTIONS - You lose your major action for your next turn in the initiative but use this during someone else's turn instead
        {
            baseActionName: "Defend",
            actionDuration: "Interrupt Action",
            description: "You may use a defend action after an enemy has rolled a successful attack against you or an ally in order to attempt to ward off the attack. Describe how you are defending and then make an action roll using an appropriate attribute. A single defend action can only be used to defend one target.<br>If your attribute roll is higher than the targeted defense score, then your roll replaces the targeted defense score for that attack only.<br>Once per round as part of your defend action, you may also move up to half of your speed at any time during your action. If you are defending an ally and are adjacent to them at any point during your defend action, they may also move up to half of their speed. Neither you nor your ally provoke opportunity attacks with this movement."
        },
        {
            baseActionName: "Improvise",
            actionDuration: "Interrupt Action",
            description: "You may also use your interrupt action in order to improvise a response to a situation in combat. For example, if an ally falls off a cliff, you may use your interrupt action to invoke the flight boon and save them or to dive and try to catch them at the edge of the cliff. Improvised interrupt actions should generally be limited to non-offensive reactions meant to assist allies. Improvised actions should help tell an exciting story, if a particular improvised action doesn't fit the narrative well, the GM should disallow it for the sake of the story."
        },
        
        // SPECIAL ACTIONS - These have some extra rules/timing to them
        {
            baseActionName: "Delay turn: Prepare to react",
            actionDuration: "Special Action",
            description: "You should give a general description of what you are preparing for. When the triggering action occurs, you may choose to take your turn even if it interrupts another character's turn."
        },
        {
            baseActionName: "Delay turn: Wait",
            actionDuration: "Special Action",
            description: "If you wait, you may take your turn at any time after another character has finished their turn but before another character has begun."
        },
        {
            baseActionName: "Reactionary Trance",
            actionDuration: "Free Action",
            description: "You can enter a battle trance (as per the Battle Trance feat) as a free action even when it is not your turn. You may choose to do so in reaction to another action, such as an enemy's attack, spell, or insult. You may even declare your intent to enter a battle trance after the action has been resolved (such as after the attack has already been rolled). The benefits granted from your battle trance take place before the triggering action is resolved, potentially negating damage or harmful effects that you would have otherwise incurred."
        },

        // Detailed Explanations
        {
            baseActionName: "Advantage and Disadvantage",
            actionDuration: "Detailed Explanation",
            description:"When you have advantage on an action, roll an extra number of attribute dice equal to your advantage level. Then, when adding your dice together, ignore the lowest X attribute dice, in which X is your advantage level.<br>Disadvantage works in a similar manner. When you have disadvantage, you still roll an extra number of attribute dice equal to your disadvantage value. However, instead of ignoring the lowest dice, you ignore the highest dice."
        },
        {
            baseActionName: "Determine Attribute Versus Defense",
            actionDuration: "Detailed Explanation",
            description:"First, choose the most logical attribute for the type of attack you are making. Every attack is either physical or extraordinary.<br><b>Physical attacks</b> involve weapons, claws, teeth, or other natural means of inflicting damage that typically rely on the attacker's Might or Agility attribute. When attacking with a weapon, your weapon’s forceful or precise property will determine which attribute to use.<br><b>Non-physical attacks</b> are those that make use of one of the attacker's attributes other than Might or Agility, such as by using Energy to summon a ball of fire or Logic to spring a trap. A character can only make a non-physical attack with an extraordinary attribute if they possess a score of 1 or higher in the relevant attribute.<br>Once you have chosen your attacking attribute, determine an appropriate defense (Guard, Toughness, or Resolve) to use as the Challenge Rating for your attack, as follows.<br>Physical attacks always target Guard.<br>Non-physical attacks are more open-ended and often require the GM to decide the type of defense targeted using the following guidelines:<br><br><b>Guard</b> protects against attacks that can be dodged, deflected, or avoided by taking cover, such as a ball of flame, magical wall of blades, or a laser beam.<br><b>Toughness</b> is used to defend against attacks that require bodily endurance, health, or sturdiness, such as poison and necrotic energy.<br><b>Resolve</b> guards against mental assaults and deceptions, such as attacks from a phantasmal beast or damage caused by an illusory pit."
        },
        {
            baseActionName: "Choose Your Target",
            actionDuration: "Detailed Explanation",
            description:"You must choose a target within range of the type of attack you are making:<br><b>Melee physical attacks</b> target foes that are within reach of you.<br><b>Ranged physical attacks</b> can target foes within the range of the weapon being used at no penalty. Attacks suffer disadvantage 1 per extra range increment beyond the first, to a maximum of disadvantage 2 at three times the weapon's range.<br><b>Non-physical attacks</b> have a range determined by the score of the attribute being used, as detailed in the Non-Physical Attack Range table. Unlike ranged weapons, these attacks cannot extend beyond their normal range.<br><table><tr><th>Attribute Score</th><th>Range</th></tr><tr><td>1-3</td><td>25 feet</td></tr><tr><td>4-6</td><td>50 feet</td></tr><tr><td>7-9</td><td>75 feet</td></tr></table>"
        },
        {
            baseActionName: "Roll Your Attack",
            actionDuration: "Detailed Explanation",
            description:"Make an action roll using the attribute determined in 'Determine Attribute Versus Defense'. You deal damage equal to your action roll minus the target's defense, ignoring negative results. This damage is subtracted from the target's hit points. If you meet or exceed the target's defense, you deal a minimum of three damage."
        },
        {
            baseActionName: "Exceptional Success",
            actionDuration: "Detailed Explanation",
            description:"If your attack roll exceeds the target's defense by 10 or more, you may apply one bane of a power level less than or equal to the attribute you used for the attack. In order to apply a bane, your attack roll must equal or exceed the appropriate defense for that bane. If your attack targeted multiple foes, you may apply the bane to each qualifying target.<br><br>As an alternative to triggering a bane, you may choose to disrupt the target's concentration. You cancel a single boon being sustained by the target of your attack. If your attack targeted multiple foes, then you may cancel one boon being sustained by each target."
        },
        {
            baseActionName: "Multi-targeting",
            actionDuration: "Detailed Explanation",
            description:"By default, your attacks target a single foe. However, you may choose to target multiple individual foes or to target an area, provided that all of your targets fall within your attack’s range.<br>Targeting more than one foe causes disadvantage on your attack roll, as described below.<br><br><b>Melee Multi-targeting</b><br>You may target any number of foes that are within your reach. When targeting more than one foe, you suffer disadvantage equal to the number of foes targeted (2 targets = disadvantage 2, 3 targets = disadvantage 3, etc.)<br><b>Ranged Multi-targeting</b><br>You may target up to five foes that fall within a 25' square. When targeting more than one foe, you suffer disadvantage equal to the number of foes targeted, as with melee attacks.<br><br><b>Area Multi-targeting</b><br>Area attacks are only possible when you are using an extraordinary attribute, unless a specific weapon property or other rule allows you to make area attacks without an extraordinary attribute. You may choose from a variety of shapes when making an area attack, as described below. Friends and foes alike that fall within the targeted area will be subject to your attack.<br><b>Cube.</b> You target a cube with equal length, width, and height designated by you. The attack suffers disadvantage 1 per 5' length of the cube's sides, unless it's a single 5' cube, which does not incur disadvantage. For example, a 10' cube suffers disadvantage 2, a 15’ cube suffers disadvantage 3, and so on.<br><b>Line.</b>You target a line that is 5' wide, 10' long, and 10' high. You may create several lines as part of a single attack, as long as at least one corner of each line touches. For each line, the attack suffers disadvantage 1.<br><b>Cone.</b> You target a cone that extends from your space to a length you designate. At any given point, the cone is as wide as its distance from you. Your attack suffers disadvantage 1 per 5' of length of the cone, unless it's 5' long, which does not incur disadvantage."
        },
        {
            baseActionName: "Lethal Damage",
            actionDuration: "Detailed Explanation",
            description:"Lethal damage is used sparingly in Open Legend as a way for GMs to paint a picture of injury consequences over time. This is especially helpful for grim and gritty storylines where the effects of injury should extend beyond a combat encounter. Lethal damage is also appropriate for traps or environmental hazards, which often occur outside of combat and thus would pose no threat using the usual damage and healing rules.<br>When a character suffers lethal damage, their maximum hit point total is reduced by the amount of lethal damage it sustains. The maximum lethal damage a creature can accrue is equal to its maximum hit points. If a creature sustains lethal damage greater than or equal to its maximum hit point total, the creature is unconscious until it heals at least 1 hit point of lethal damage."
        },
        {
            baseActionName: "Healing Lethal Damage",
            actionDuration: "Detailed Explanation",
            description:"Lethal damage is more difficult to heal then regular damage, healing at a rate of 1 hit point per day per Fortitude attribute point (minimum of 1 hit point). With the full-time attendance of a capable healer or doctor, any number of characters who are located in the same area and avoid strenuous activity heal at an additional rate equal to their attendant's Creation, Presence, or Learning score. Multiple attendants do not cumulatively improve this accelerated healing rate (the bonus is simply equal to the highest score among attendants).<br>For example, a warrior with Fortitude 4 heals 4 lethal damage per day on their own. With the assistance of a physician with a learning score of 8, the same warrior would heal at a rate of 12 lethal damage per day."
        },
        {
            baseActionName: "Critical Hits (Optional Rule)",
            actionDuration: "Detailed Explanation",
            description: "To add a more gritty realism to a game, GMs can implement the optional critical hits rule.<br>Under this rule, whenever a natural 20 is rolled on the d20 used in a damaging attack roll, the attack inflicts some lethal damage. The amount of lethal damage is equal to the total of subsequent d20 rolls for that attack (i.e., the d20 explosion total), with a maximum equal to the damage dealt by the attack."
        },
        {
            baseActionName: "Legend Points",
            actionDuration: "Detailed Explanation",
            description: "An additional layer of depth to action resolution comes in the form of legend points, which allow players an opportunity to stack the dice when it comes time to perform a particularly legendary action.<br>Characters begin play with zero legend points, and the maximum they may acquire is 10. The GM may reward a PC with a legend point when they use one of their flaws to their own disadvantage or for particularly strong roleplaying.<br>A PC may spend a maximum number of legend points equal to their level plus one in order to enhance a single action roll.<br>Before making an action roll, the PC declares how many legend points they are spending, and gains advantage 1 on the roll for each legend point spent. Additionally, for each legend point spent on the roll a +1 is added to the end result."
        }
    ],

    // WEAPON PROPERTIES - Descriptions and rules for weapon properties
    weaponProperties: {
        "Augmenting":"Banes associated with this item can be delivered via an alternate method, such as a weapon or other damaging attack. Applying the item's augmentation to an attack is a move action which consumes the item. Upon application, you choose a bane the item can invoke. The next attack made with the augmented item triggers that bane if your roll is equal to or above the target's defense score. Examples of the augmenting property include poison, special ammo cartridges, and magical jewels that can be attuned to a weapon to enhance its power. All augmenting items must have the expendable property.",
        "Area":"An item with the area property always makes multi-target area attacks or invocations of the listed size and shape and cannot be used to make non-area attacks. If an item has multiple area sizes, the attacker chooses from them with each attack. Attack and action rolls do not incur any of the disadvantage penalties usually associated with multi-targeting.",
        "Autonomous":"When created, the item's crafter sets a specific condition that causes the item to trigger one particular action. This autonomy could be magical guidance, algorithmic targeting via a guidance system, or even mundane autonomy, such as pressure plates surrounded by murder holes (arrow slits with self-reloading crossbows).",
        "Baneful":"When making a damaging attack with this item, you may automatically inflict a listed bane if your attack roll exceeds the target's defense by 5 or more. The bane can be triggered this way in lieu of other banes, even if the item or wielder cannot access the bane. The invoking attribute for this bane is equal to the attacking attribute.",
        "Consumable":"A consumable item can be used once to invoke a boon at the listed power level. This boon invocation succeeds automatically without a roll and cannot be invoked with multi-targeting. Afterwards, the item is consumed and cannot be used again.",
        "Damage Type":"When making a damaging attack with this item, you may choose to have it inflict damage of the listed type in lieu of the type it would otherwise deal. This property can only be applied to an item once. The damage types are: precise, forceful, fire, cold, lightning, acid, influence, and entropy, though a GM may allow or create other types.",
        "Cursed":"The wielder of this item is automatically afflicted with the indicated bane at the listed power level. The bane cannot be shaken off using the resist bane action. Furthermore, the cursed item cannot be unequipped unless the wielder is subject to the restoration boon at a power level high enough to dispel the bane.",
        "Deadly":"Some weapons are so effective that their potency makes the wielder significantly more capable. Attacks made with this weapon gain advantage equal to their deadly value. A weapon cannot have a deadly value greater than 3.",
        "Expendable":"An expendable item can be used once to make an attack or invoke a bane. Afterwards, the item is expended and cannot be used again.",
        "Persistent":"An item with this property automatically invokes and sustains a single instance of the indicated boon without requiring the wielder to make an invocation roll or use the sustain a boon action. If the duration of a boon is instantaneous, the item automatically invokes the boon each round at the start of the wielder's turn. The wielder does not have to invoke this effect. The item's effect persists automatically unless the wielder spends a minor action to deactivate it, in which case it remains deactivated until the wielder spends a minor action to reactivate it.",
        "Potent":"Targets suffer disadvantage 1 on resist rolls to shake off banes inflicted by this item.",
        "Powerful":"Bane or boon invocations made with this item have advantage equal to the item's powerful value. An item cannot have a powerful value greater than 3.",
        "Reliable":"The wielder does not have to roll to invoke this item's listed boons if they are targeting a single creature. The invocation automatically succeeds. If the item also has the area property, it may still benefit from the automatic success granted by the reliable property.",
        "Sentient":"The item becomes either self-aware or capable of basic human reasoning. It has no inherent bond with its creator, and is treated like any other NPC. It gets its own turn and array of actions. The item gains no mental or social attributes, only the ability to think. At the GM's discretion, it may also gain a particular mode of movement, such as walking, climbing, flying, or swimming.",
        "One-handed Melee":"The weapon uses a single hand and allows the other hand to be used for carrying another object, second weapon, or kept free for other actions. When wielding a one-handed weapon in each hand, if neither has the defensive property, you gain advantage 1 to all melee attacks. If both weapons you are wielding have passive benefits such as the defensive property, use the best of the two benefits; they are not added together.",
        "Two-Handed Melee":"The weapon requires two hands to wield and cannot be used with a shield or other weapon. Two-handed melee weapons grant advantage 1 to all attacks.",
        "Versatile Melee":"The weapon can be wielded either one-handed or two-handed. The wielder can freely switch between the two modes and has all of the benefits and restrictions of whichever mode they are using.",
        "Close Ranged":"Range increment of 25'. They are built to be compact and effective in close quarters, so they are less bulky. They can be wielded with a single hand, allowing the other hand to be used for carrying a shield, second weapon, or kept free for other actions.",
        "Short Ranged":"Range increment of 50'. They  are built to be compact and effective in close quarters, so they are less bulky. They can be wielded with a single hand, allowing the other hand to be used for carrying a shield, second weapon, or kept free for other actions.",
        "Medium Ranged":"Range increment of 75'. They have various strengths, but are not built for close quarters combat. As such, they require two hands and cannot be used with any weapon or other item in the wielders off hand.",
        "Long Ranged":"Range increment of 125'. They have various strengths, but are not built for close quarters combat. As such, they require two hands and cannot be used with any weapon or other item in the wielders off hand.",
        "Extreme Ranged":"Range increment of 300'. They have various strengths, but are not built for close quarters combat. As such, they require two hands and cannot be used with any weapon or other item in the wielders off hand. Also, they are specially built for distance and cannot be used to attack a target closer than 50'.",
        "Defensive":"A defensive weapon grants advantage equal to the listed value when its wielder takes the defend action. Additionally, you gain a +1 armor bonus when wielding a defensive weapon (regardless of the defensive value listed). While wielding an item with the defensive property, you don't gain the advantage 1 to attacks normally associated with Melee One-handed or Two-handed weapons. A weapon cannot have a defensive value greater than 3.",
        "Delayed Ready":"This weapon can only be used once per round. In addition, prior to using the weapon, the wielder must spend a move action to ready it.",
        "Forceful":"This weapon can make attacks with the Might attribute and invoke banes accessible via Might.",
        "Heavy":"The weapon is particularly heavy to carry. You may carry a maximum number of heavy items equal to your Might score.",
        "Precise":"This weapon can be used to make attacks with the Agility attribute and invoke banes accessible via Agility.",
        "Reach":"This weapon extends the natural melee range of the creature by 5'.",
        "Slow":"If you are wielding this weapon at the beginning of combat, you gain disadvantage 2 on your initiative roll. If you are not wielding the weapon but plan to use it on your first turn, this penalty is still applied. If you are wielding multiple weapons, your initiative modifier is equal to the slowest among them (slow, swift, or neither).",
        "Stationary":"The bulk and weight of this weapon is enormous. Moving it requires a focus action, which allows it to be moved up to 30 feet.",
        "Swift":"If you are wielding this weapon at the beginning of combat, you gain advantage 2 on your initiative roll. If you are not wielding the weapon but plan to use it on your first turn, you still get this bonus. If you are wielding multiple weapons, your initiative modifier is equal to the slowest among them (slow, swift, or neither).",
        "Test":"Bebe"

    }

};










// Database object created successfully

// Export the database for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GAME_DATABASE;
} else {
    // For browser usage, attach to window
    window.GAME_DATABASE = GAME_DATABASE;
    
    // Database loaded successfully
}
