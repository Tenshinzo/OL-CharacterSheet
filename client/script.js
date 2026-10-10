// Open Legend Character Sheet App
class CharacterSheetApp {
    constructor() {
        try {
            
            // Check if required elements exist - moved to after DOM is ready
            // this.checkRequiredElements();
            
            this.characters = this.loadCharacters();
            // Clean up any remaining legacy fields and save
            if (this.characters.length > 0) {
                this.characters.forEach(character => this.migrateLegacyFields(character));
                this.saveCharacters();
            }
            this.currentCharacter = null;
            this.selectedFile = null;
            
            // Load custom boons and banes
            this.customBoons = this.loadCustomBoons();
            this.customBanes = this.loadCustomBanes();
            
            this.initializeEventListeners();
            this.showMainPage();

            // Populate dropdowns after a short delay to ensure DOM is ready
            setTimeout(() => {
                this.populateFeatsDropdown();
                this.populateBoonsDropdown();
                this.populateBanesDropdown();
                this.populatePerksDropdown();
                this.populateFlawsDropdown();
                this.populateWeaponBanesDropdowns();
            }, 200);
        this.populateAvailableBoonsAndBanes();
        
        // Delay base actions population to ensure database is loaded
        setTimeout(() => {
            this.populateBaseActions();
        }, 500);
        

        
        // Debug methods removed for production
            
            // Ensure footer is visible on initial load
            document.body.classList.add('showing-main-page');
            
            // CharacterSheetApp initialized successfully
        } catch (error) {
            console.error('Error initializing CharacterSheetApp:', error);
            this.showErrorNotification('Failed to initialize application: ' + error.message);
        }
    }

    // Check if all required DOM elements exist
    checkRequiredElements() {
        const requiredElements = [
            'newCharBtn', 'importBtn', 'exportBtn', 'createFirstCharBtn',
            'backToMainBtn', 'saveCharBtn', 'experiencePoints', 'charArchetype',
            'damageBtn', 'healBtn', 'lethalDamageBtn', 'lethalHealBtn', 'resetHPBtn', 'resetLethalBtn',
            'testGuardBtn', 'testToughnessBtn', 'testResolveBtn',
            'addAdvantageBtn', 'addDisadvantageBtn', 'addBoonBtn', 'addBaneBtn', 'addPerkBtn', 'addFlawBtn',
            'advantageFilter', 'equipmentType', 'boonAttribute', 'boonResistanceType',
            'addEquipmentBtn', 'addFeatBtn', 'confirmImportBtn', 'uploadFileBtn',
            'mainPage', 'characterSheetPage'
        ];
        
        // Checking required elements...
        const missingElements = [];
        requiredElements.forEach(id => {
            const element = document.getElementById(id);
            if (!element) {
                missingElements.push(id);
                console.error(`Missing element: ${id}`);
            }
        });
        
        if (missingElements.length > 0) {
            const errorMsg = `Missing required elements: ${missingElements.join(', ')}`;
            console.error(errorMsg);
            console.error('Available elements:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
            throw new Error(errorMsg);
        }
        
        // All required elements found successfully
    }

    // Safe event listener helper
    safeAddEventListener(elementId, eventType, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(eventType, handler);
        } else {
            console.warn(`Element with id '${elementId}' not found, skipping event listener`);
        }
    }

    // Show error notification
    showErrorNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff6b6b;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: bold;
            max-width: 80%;
            text-align: center;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 10000);
    }

    // Initialize all event listeners
    initializeEventListeners() {
        try {
            // Header controls
            this.safeAddEventListener('newCharBtn', 'click', () => this.createNewCharacter());
            this.safeAddEventListener('importBtn', 'click', () => this.showImportModal());
            this.safeAddEventListener('exportBtn', 'click', () => this.exportCharacters());
        
            // Main page controls
            this.safeAddEventListener('createFirstCharBtn', 'click', () => this.createNewCharacter());
            this.safeAddEventListener('optionsListBtn', 'click', () => this.showOptionsListPage());
        
            // Character sheet controls
            this.safeAddEventListener('backToMainBtn', 'click', () => this.showMainPage());
            this.safeAddEventListener('backToMainFromOptionsBtn', 'click', () => this.showMainPage());
            this.safeAddEventListener('saveCharBtn', 'click', () => this.saveCurrentCharacter());
            this.safeAddEventListener('editCharBtn', 'click', () => this.toggleViewMode());
        
            // Character name change
            document.getElementById('charName').addEventListener('input', () => this.updateCharacterNameDisplay());
        
            // Character archetype change
            document.getElementById('charArchetype').addEventListener('input', () => this.updateCharacterArchetypeDisplay());
        
            // Experience and attributes
            document.getElementById('experiencePoints').addEventListener('change', () => this.updateExperienceAndLevel());
        
            // Custom Health Buff
            this.safeAddEventListener('customHealthBuff', 'change', () => this.updateCustomHealthBuff());
        
            // Manual Settings Toggle
            this.safeAddEventListener('manualSettingsToggle', 'change', () => this.toggleManualSettings());
        
            // Manual defense value inputs
            this.safeAddEventListener('guardValueManual', 'change', () => this.saveManualDefense('guard'));
            this.safeAddEventListener('toughnessValueManual', 'change', () => this.saveManualDefense('toughness'));
            this.safeAddEventListener('resolveValueManual', 'change', () => this.saveManualDefense('resolve'));
        
            // Manual movement speed inputs
            this.safeAddEventListener('movementSpeedManual', 'change', () => this.saveManualMovement('movement'));
            this.safeAddEventListener('climbingSpeedManual', 'change', () => this.saveManualMovement('climbing'));
            this.safeAddEventListener('swimmingSpeedManual', 'change', () => this.saveManualMovement('swimming'));
            this.safeAddEventListener('flyingSpeedManual', 'change', () => this.saveManualMovement('flying'));
        
            // Attribute changes - validation and updates handled by plus/minus buttons
            // No duplicate event listeners here
        
            // HP controls
            document.getElementById('damageBtn').addEventListener('click', () => this.applyDamage());
            document.getElementById('healBtn').addEventListener('click', () => this.applyHealing());
            document.getElementById('lethalDamageBtn').addEventListener('click', () => this.applyLethalDamage());
            document.getElementById('lethalHealBtn').addEventListener('click', () => this.applyLethalHealing());
            document.getElementById('resetHPBtn').addEventListener('click', () => this.resetHP());
            document.getElementById('resetLethalBtn').addEventListener('click', () => this.resetLethalDamage());
        
            // Combat stat attack tests
            document.getElementById('testGuardBtn').addEventListener('click', () => this.testAttack('guard'));
            document.getElementById('testToughnessBtn').addEventListener('click', () => this.testAttack('toughness'));
            document.getElementById('testResolveBtn').addEventListener('click', () => this.testAttack('resolve'));
        
            // Advantages, disadvantages, boons, and banes
            document.getElementById('addAdvantageBtn').addEventListener('click', () => this.addAdvantage());
            document.getElementById('addDisadvantageBtn').addEventListener('click', () => this.addDisadvantage());
            document.getElementById('addBoonBtn').addEventListener('click', () => this.addBoon());
            document.getElementById('addBaneBtn').addEventListener('click', () => this.addBane());
        
            // Advantage/disadvantage filters
            document.getElementById('advantageFilter').addEventListener('change', () => this.filterAdvantages());

        

        
            // Boon duration change for sustain checkbox

            
            // Boon and bane selection changes
            document.getElementById('boonSelect').addEventListener('change', () => this.onBoonSelectionChange());
            document.getElementById('baneSelect').addEventListener('change', () => this.onBaneSelectionChange());
        
                    // Equipment and feats
        document.getElementById('addEquipmentBtn').addEventListener('click', () => this.addEquipment());
        document.getElementById('addFeatBtn').addEventListener('click', () => this.addFeat());
        
        // Validation button
        document.getElementById('validateBoonsBtn').addEventListener('click', () => this.validateBoonsAndBanes());
        
            // Equipment type change
            document.getElementById('equipmentType').addEventListener('change', () => this.toggleEquipmentFields());
        
            // Initialize equipment fields display on page load
            this.toggleEquipmentFields();
        
            // Universal property checkboxes for all equipment types
            // Ensure game database is loaded before setting up listeners
            if (window.GAME_DATABASE && window.GAME_DATABASE.boons) {
                this.setupUniversalPropertyListeners();
            } else {
                // Game database not loaded yet, waiting...
                // Wait for game database to load
                const checkDatabase = () => {
                    if (window.GAME_DATABASE && window.GAME_DATABASE.boons) {
                        // Game database loaded, setting up universal property listeners...
                        this.setupUniversalPropertyListeners();
                    } else {
                        setTimeout(checkDatabase, 100);
                    }
                };
                checkDatabase();
            }
        
            // Weapon-specific property checkboxes
            document.getElementById('weaponDefensive').addEventListener('change', () => this.toggleWeaponPropertyInputs());
            document.getElementById('weaponDeadly').addEventListener('change', () => this.toggleWeaponPropertyInputs());
            document.getElementById('weaponDamageType').addEventListener('change', () => this.toggleWeaponPropertyInputs());
            document.getElementById('weaponBaneful').addEventListener('change', () => this.toggleWeaponPropertyInputs());
        
            // Equipment edit form event listeners
            this.setupEquipmentEditListeners();
        
            // Perks and flaws
            document.getElementById('addPerkBtn').addEventListener('click', () => this.addPerk());
            document.getElementById('addFlawBtn').addEventListener('click', () => this.addFlaw());
        
            // Favorite actions
            this.safeAddEventListener('addFavoriteActionBtn', 'click', () => this.addFavoriteAction());
        
            // Character image upload
            document.getElementById('uploadImageBtn').addEventListener('click', () => this.triggerImageUpload());
            document.getElementById('imagePreview').addEventListener('click', () => this.triggerImageUpload());
            document.getElementById('charImage').addEventListener('change', (e) => this.handleImageUpload(e));
        
                        // Combat stats
            document.getElementById('decreaseLegendBtn').addEventListener('click', () => this.decreaseLegendPoints());
            document.getElementById('increaseLegendBtn').addEventListener('click', () => this.increaseLegendPoints());
        
            // Attribute change listeners for combat stats - handled by plus/minus buttons
        
            // Modal controls
            document.querySelectorAll('.close').forEach(closeBtn => {
                closeBtn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
            });
        
            document.getElementById('confirmImportBtn').addEventListener('click', () => this.importCharacter());
        
            // Auto-save on input changes (only for important fields)
            this.setupAutoSave();
        
            // Add attribute input validation
            // Attribute validation is now handled by the plus/minus buttons
            // No need for change event listeners on spans
        
            // Feat selection changes
            const featSelect = document.getElementById('featSelect');
            if (featSelect) {
                featSelect.addEventListener('change', () => this.onFeatSelectionChange());
            } else {
                console.warn('featSelect element not found');
            }
            
            // Perk selection changes
            const perkSelect = document.getElementById('perkSelect');
            if (perkSelect) {
                perkSelect.addEventListener('change', () => this.onPerkSelectionChange());
            } else {
                console.warn('perkSelect element not found');
            }
            
            // Flaw selection changes
            const flawSelect = document.getElementById('flawSelect');
            if (flawSelect) {
                flawSelect.addEventListener('change', () => this.onFlawSelectionChange());
            } else {
                console.warn('flawSelect element not found');
            }
        
            const featTierSelect = document.getElementById('featTierSelect');
            if (featTierSelect) {
                featTierSelect.addEventListener('change', () => this.onTierSelectionChange());
            } else {
                console.warn('featTierSelect element not found');
            }
        

            
            // Navigation tabs
            const navTabs = document.querySelectorAll('.nav-tab');
            // Navigation tabs found
            navTabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    const section = e.currentTarget.dataset.section;
                    // Navigation tab clicked
                    if (section) {
                        this.switchSection(section);
                    }
                });
            });
        
            // Debug: Check what sections are available
            const sections = document.querySelectorAll('[id$="Section"]');
            // Top-level sections found
        
            // Custom Boons & Banes controls
            this.safeAddEventListener('addCustomBoonBtn', 'click', () => this.showCustomBoonModal());
            this.safeAddEventListener('addCustomBaneBtn', 'click', () => this.showCustomBaneModal());
            this.safeAddEventListener('exportCustomBtn', 'click', () => this.exportCustomEntries());
            this.safeAddEventListener('exportCustomTextBtn', 'click', () => this.exportCustomEntriesAsText());
            this.safeAddEventListener('importCustomBtn', 'click', () => this.showImportCustomModal());
            this.safeAddEventListener('copyExportTextBtn', 'click', () => this.copyExportTextToClipboard());
            this.safeAddEventListener('closeExportTextBtn', 'click', () => this.closeModal(document.getElementById('exportCustomTextModal')));
            
            // Custom boon modal controls
            this.safeAddEventListener('saveCustomBoonBtn', 'click', () => this.handleCustomBoonSubmit());
            this.safeAddEventListener('cancelCustomBoonBtn', 'click', () => this.closeModal(document.getElementById('customBoonModal')));
            
            // Custom bane modal controls
            this.safeAddEventListener('saveCustomBaneBtn', 'click', () => this.handleCustomBaneSubmit());
            this.safeAddEventListener('cancelCustomBaneBtn', 'click', () => this.closeModal(document.getElementById('customBaneModal')));
            
            // Import custom entries modal controls
            this.safeAddEventListener('uploadCustomFileBtn', 'click', () => this.uploadCustomFile());
            this.safeAddEventListener('confirmImportCustomBtn', 'click', () => this.confirmImportCustom());
            this.safeAddEventListener('customJsonFileInput', 'change', (e) => this.handleCustomFileSelection(e));
            this.safeAddEventListener('removeCustomFileBtn', 'click', () => this.removeCustomFile());
            
            // Custom file upload area click
            const customUploadArea = document.getElementById('customFileUploadArea');
            if (customUploadArea) {
                customUploadArea.addEventListener('click', () => {
                    document.getElementById('customJsonFileInput').click();
                });
            }
            
            // Dynamic field generation for custom boon/bane power levels
            this.safeAddEventListener('customBoonPowerLevels', 'blur', () => {
                const powerLevelsStr = document.getElementById('customBoonPowerLevels').value.trim();
                if (powerLevelsStr) {
                    const powerLevels = powerLevelsStr.split(',').map(pl => parseInt(pl.trim())).filter(pl => !isNaN(pl));
                    this.generatePowerLevelFields('boon', powerLevels, {});
                }
            });
            
            this.safeAddEventListener('customBanePowerLevels', 'blur', () => {
                const powerLevelsStr = document.getElementById('customBanePowerLevels').value.trim();
                if (powerLevelsStr) {
                    const powerLevels = powerLevelsStr.split(',').map(pl => parseInt(pl.trim())).filter(pl => !isNaN(pl));
                    this.generatePowerLevelFields('bane', powerLevels, {});
                }
            });
            
            // Dynamic defense targets generation when bane attributes change
            const baneAttrCheckboxes = document.querySelectorAll('input[name="customBaneAttr"]');
            baneAttrCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    const selectedAttrs = [];
                    document.querySelectorAll('input[name="customBaneAttr"]:checked').forEach(cb => {
                        selectedAttrs.push(cb.value);
                    });
                    if (selectedAttrs.length > 0) {
                        this.generateDefenseTargetFields(selectedAttrs, {});
                    }
                });
            });
        
            // Close modals when clicking outside
            window.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal')) {
                    this.closeModal(e.target);
                }
            });
        } catch (error) {
            console.error('Error initializing event listeners:', error);
            console.warn('Some event listeners may not have been set up properly');
        }
    }

    // Character image upload functionality
    triggerImageUpload() {
        document.getElementById('charImage').click();
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showNotification('Please select an image file.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentCharacter.charImage = e.target.result;
            this.displayCharacterImage();
            this.saveCurrentCharacterSilently();
            this.showNotification('Image uploaded successfully!', 'success');
        };
        reader.readAsDataURL(file);
    }

    displayCharacterImage() {
        const imagePreview = document.getElementById('imagePreview');
        if (this.currentCharacter.charImage) {
            imagePreview.innerHTML = `<img src="${this.currentCharacter.charImage}" alt="Character Image">`;
        } else {
            imagePreview.innerHTML = `
                <i class="fas fa-user-circle"></i>
                <span>Click to upload image</span>
            `;
        }
    }

    // Combat stats methods
    updateMovementStats() {
        if (!this.currentCharacter) return;
        
        // Check if in manual mode
        if (this.currentCharacter.manualSettings && this.currentCharacter.manualOverrides) {
            // Use manual overrides
            const movementSpeed = this.currentCharacter.manualOverrides.movementSpeed || 30;
            const climbingSpeed = this.currentCharacter.manualOverrides.climbingSpeed || 15;
            const swimmingSpeed = this.currentCharacter.manualOverrides.swimmingSpeed || 15;
            const flyingSpeed = this.currentCharacter.manualOverrides.flyingSpeed || 0;
            
            // Update manual inputs if they're visible
            const movementInput = document.getElementById('movementSpeedManual');
            const climbingInput = document.getElementById('climbingSpeedManual');
            const swimmingInput = document.getElementById('swimmingSpeedManual');
            const flyingInput = document.getElementById('flyingSpeedManual');
            
            if (movementInput && movementInput.style.display !== 'none') {
                movementInput.value = movementSpeed;
            }
            if (climbingInput && climbingInput.style.display !== 'none') {
                climbingInput.value = climbingSpeed;
            }
            if (swimmingInput && swimmingInput.style.display !== 'none') {
                swimmingInput.value = swimmingSpeed;
            }
            if (flyingInput && flyingInput.style.display !== 'none') {
                flyingInput.value = flyingSpeed;
            }
            return;
        }
        
        const baseMovementSpeed = this.currentCharacter.movementSpeed || 30;
        
        
        let fleetOfFootBonus = 0;
        const fleetOfFootFeat = this.currentCharacter.feats && this.currentCharacter.feats.find(feat => feat.name === 'Fleet of Foot');
        if (fleetOfFootFeat && fleetOfFootFeat.tier) {
            fleetOfFootBonus = fleetOfFootFeat.tier * 5; // +5 per tier
        }
        
        
        const totalBaseSpeed = baseMovementSpeed + fleetOfFootBonus;
        
        // Check if equipped armor has speed reduction
        let effectiveMovementSpeed = totalBaseSpeed;
        const equippedArmor = this.getEquippedArmor();
        
        // Check for Armor Mastery feat to reduce movement penalty
        let movementPenalty = 0;
        if (equippedArmor && equippedArmor.speedReduction) {
            movementPenalty = 5; // Default penalty
            
            // Armor Mastery Tier 2 reduces movement penalty by 5'
            const armorMasteryFeat = this.currentCharacter.feats && this.currentCharacter.feats.find(feat => feat.name === 'Armor Mastery');
            if (armorMasteryFeat && armorMasteryFeat.tier >= 2) {
                movementPenalty = Math.max(0, movementPenalty - 5);
                // AM T2: -5ft penalty
            }
            
            effectiveMovementSpeed = Math.max(0, totalBaseSpeed - movementPenalty);
        }
        
        
        const hasteBoon = this.currentCharacter.boons && this.currentCharacter.boons.find(boon => boon.name === 'Haste');
        if (hasteBoon && hasteBoon.powerLevel) {
            let hasteBonus = 0;
            switch (hasteBoon.powerLevel) {
                case 2:
                    hasteBonus = 10;
                    break;
                case 4:
                    hasteBonus = 15;
                    break;
                case 6:
                    hasteBonus = 20;
                    break;
                case 8:
                    hasteBonus = 30;
                    break;
                default:
                    hasteBonus = 0;
            }
            effectiveMovementSpeed += hasteBonus;
        }
        
        // Check for Slowed bane
        const slowedBane = this.currentCharacter.banes && this.currentCharacter.banes.find(bane => bane.name === 'Slowed');
        if (slowedBane) {
            // If both Haste and Slowed are active, they cancel each other out
            if (hasteBoon && hasteBonus > 0) {
                effectiveMovementSpeed -= hasteBonus;
            } else {
                // Apply Slowed effect: half speed, rounded down to nearest 5' increment
                const halfSpeed = Math.floor(effectiveMovementSpeed / 2);
                effectiveMovementSpeed = Math.floor(halfSpeed / 5) * 5; // Round down to nearest 5
            }
        }
        
        // Check for Immobile bane - overrides all movement to 0
        const immobileBane = this.currentCharacter.banes && this.currentCharacter.banes.find(bane => bane.name === 'Immobile');
        if (immobileBane) {
            effectiveMovementSpeed = 0;
        }
        
        
        // Update movement speed display to show effective speed
        document.getElementById('movementSpeed').textContent = effectiveMovementSpeed;
        
        // Update climbing and swimming speeds
        let climbingSpeed;
        if (immobileBane) {
            // Immobile bane overrides all movement to 0
            climbingSpeed = 0;
        } else if (slowedBane) {
            // Slowed bane affects all physical movement
            if (this.currentCharacter.feats && this.currentCharacter.feats.some(feat => feat.name === 'Climbing')) {
                // With Climbing feat, climbing speed equals movement speed (already affected by Slowed)
                climbingSpeed = effectiveMovementSpeed;
            } else {
                // Without Climbing feat, climbing speed is half of movement speed (already affected by Slowed)
                climbingSpeed = Math.floor(effectiveMovementSpeed / 2);
            }
        } else if (this.currentCharacter.feats && this.currentCharacter.feats.some(feat => feat.name === 'Climbing')) {
            // With Climbing feat, climbing speed equals movement speed
            climbingSpeed = effectiveMovementSpeed;
        } else {
            // Without Climbing feat, climbing speed is half of movement speed
            climbingSpeed = Math.floor(effectiveMovementSpeed / 2);
        }
        
        // Check if character has the Swimming feat
        let swimmingSpeed;
        if (immobileBane) {
            // Immobile bane overrides all movement to 0
            swimmingSpeed = 0;
        } else if (slowedBane) {
            // Slowed bane affects all physical movement
            if (this.currentCharacter.feats && this.currentCharacter.feats.some(feat => feat.name === 'Swimming')) {
                // With Swimming feat, swimming speed equals movement speed (already affected by Slowed)
                swimmingSpeed = effectiveMovementSpeed;
            } else {
                // Without Swimming feat, swimming speed is half of movement speed (already affected by Slowed)
                swimmingSpeed = Math.floor(effectiveMovementSpeed / 2);
            }
        } else if (this.currentCharacter.feats && this.currentCharacter.feats.some(feat => feat.name === 'Swimming')) {
            // With Swimming feat, swimming speed equals movement speed
            swimmingSpeed = effectiveMovementSpeed;
        } else {
            // Without Swimming feat, swimming speed is half of movement speed
            swimmingSpeed = Math.floor(effectiveMovementSpeed / 2);
        }
        
        // Check if character has the Flying feat or Flight boon
        const hasFlyingFeat = this.currentCharacter.feats && this.currentCharacter.feats.some(feat => feat.name === 'Flying');
        const flightBoon = this.currentCharacter.boons && this.currentCharacter.boons.find(boon => boon.name === 'Flight');
        const hasFlightBoon = !!flightBoon;
        const flyingSpeedContainer = document.getElementById('flyingSpeedContainer');
        const flyingSpeedElement = document.getElementById('flyingSpeed');
        
        if (hasFlyingFeat || hasFlightBoon) {
            // Show flying speed container
            flyingSpeedContainer.classList.remove('hidden');
            
            // Calculate flying speed based on source
            let flyingSpeed;
            if (immobileBane) {
                // Immobile bane overrides all movement to 0
                flyingSpeed = 0;
            } else if (slowedBane) {
                // Slowed bane affects all physical movement including flying
                if (hasFlightBoon && flightBoon.powerLevel) {
                    // Flight boon: calculate base speed then apply Slowed
                    let baseFlyingSpeed;
                    switch (flightBoon.powerLevel) {
                        case 5:
                            baseFlyingSpeed = 10;
                            break;
                        case 6:
                            baseFlyingSpeed = 30;
                            break;
                        case 8:
                            baseFlyingSpeed = 60;
                            break;
                        default:
                            baseFlyingSpeed = effectiveMovementSpeed; // fallback
                    }
                    // Apply Slowed effect: half speed, rounded down to nearest 5' increment
                    const halfSpeed = Math.floor(baseFlyingSpeed / 2);
                    flyingSpeed = Math.floor(halfSpeed / 5) * 5; // Round down to nearest 5
                } else if (hasFlyingFeat) {
                    // Flying feat: speed equals movement speed (already affected by Slowed)
                    flyingSpeed = effectiveMovementSpeed;
                } else {
                    // Fallback: speed equals movement speed (already affected by Slowed)
                    flyingSpeed = effectiveMovementSpeed;
                }
            } else if (hasFlightBoon && flightBoon.powerLevel) {
                // Flight boon: speed depends on power level
                switch (flightBoon.powerLevel) {
                    case 5:
                        flyingSpeed = 10;
                        break;
                    case 6:
                        flyingSpeed = 30;
                        break;
                    case 8:
                        flyingSpeed = 60;
                        break;
                    default:
                        flyingSpeed = effectiveMovementSpeed; // fallback
                }
            } else if (hasFlyingFeat) {
                // Flying feat: speed equals movement speed
                flyingSpeed = effectiveMovementSpeed;
            } else {
                // Fallback: speed equals movement speed
                flyingSpeed = effectiveMovementSpeed;
            }
            
            flyingSpeedElement.textContent = flyingSpeed;
        } else {
            // Hide flying speed container
            flyingSpeedContainer.classList.add('hidden');
        }
        
        document.getElementById('climbingSpeed').textContent = climbingSpeed;
        document.getElementById('swimmingSpeed').textContent = swimmingSpeed;
        
        this.autoSave();
    }

    updateInitiative() {
        if (!this.currentCharacter) return;
        
        const agilityScore = this.currentCharacter.attributes.agility || 0;
        
        // Initiative equals agility attribute score
        document.getElementById('initiativeScore').textContent = agilityScore;
        document.getElementById('initiativeDice').textContent = this.calculateAttributeDice(agilityScore, 'agility');
        
        // Update weapon advantage display
        this.updateWeaponAdvantageDisplay();
        
        this.autoSave();
    }

    updateWeaponAdvantageDisplay() {
        if (!this.currentCharacter) return;
        
        const initiativeWeaponAdvantage = document.getElementById('initiativeWeaponAdvantage');
        if (!initiativeWeaponAdvantage) return;
        
        // Check for Lightning Reflexes feat advantage
        const lightningReflexesFeat = this.currentCharacter.feats.find(feat => feat.name === 'Lightning Reflexes');
        const lightningReflexesTier = lightningReflexesFeat ? lightningReflexesFeat.tier : 0;
        
        // Get all equipped weapons
        const equippedWeapons = this.currentCharacter.equipment.filter(e => e.equipped && e.type === 'weapon');
        
        let weaponAdvantage = 0;
        let weaponDisadvantage = 0;
        
        if (equippedWeapons.length > 0) {
            // Check if any weapon has the "slow" property
            const hasSlowWeapon = equippedWeapons.some(weapon => 
                weapon.properties && weapon.properties.includes('slow')
            );
            
            if (hasSlowWeapon) {
                // At least one slow weapon - 2 disadvantage
                weaponDisadvantage = 2;
            } else {
                // Check if all weapons have the "swift" property
                const allWeaponsSwift = equippedWeapons.every(weapon => 
                    weapon.properties && weapon.properties.includes('swift')
                );
                
                if (allWeaponsSwift) {
                    // All weapons are swift - 2 advantage
                    weaponAdvantage = 2;
                }
            }
        }
        
        // Calculate total initiative advantage/disadvantage
        const totalAdvantage = lightningReflexesTier + weaponAdvantage;
        const totalDisadvantage = weaponDisadvantage;
        
        // Display the result
        if (totalAdvantage > 0 && totalDisadvantage > 0) {
            // Both advantage and disadvantage
            initiativeWeaponAdvantage.textContent = `${totalAdvantage} advantage, ${totalDisadvantage} disadvantage`;
        } else if (totalAdvantage > 0) {
            // Only advantage
            initiativeWeaponAdvantage.textContent = `${totalAdvantage} advantage`;
        } else if (totalDisadvantage > 0) {
            // Only disadvantage
            initiativeWeaponAdvantage.textContent = `${totalDisadvantage} disadvantage`;
        } else {
            // Neither advantage nor disadvantage
            initiativeWeaponAdvantage.textContent = '';
        }
    }

    decreaseLegendPoints() {
        if (!this.currentCharacter) return;
        
        if (this.currentCharacter.legendPoints > 0) {
            this.currentCharacter.legendPoints--;
            document.getElementById('legendPoints').textContent = this.currentCharacter.legendPoints;
            
            // Sync legend points to related characters
            this.syncLegendPointsToRelatedCharacters();
            
            this.autoSave();
        }
    }

    increaseLegendPoints() {
        if (!this.currentCharacter) return;
        
        if (this.currentCharacter.legendPoints < 10) {
            this.currentCharacter.legendPoints++;
            document.getElementById('legendPoints').textContent = this.currentCharacter.legendPoints;
            
            // Sync legend points to related characters
            this.syncLegendPointsToRelatedCharacters();
            
            this.autoSave();
        }
    }

    // Setup auto-save functionality (only for important fields)
    setupAutoSave() {
        try {
            // Exclude attribute inputs from auto-save since they're handled by validation
            const importantInputs = document.querySelectorAll('#charName, #experiencePoints, #viewWealthScore, #viewWealthUsed, #charDescription, #charBackground, #charNotes');
            
            if (importantInputs.length === 0) {
                console.warn('No important inputs found for auto-save setup');
                return;
            }
            
            importantInputs.forEach(input => {
                if (input) {
                    input.addEventListener('change', () => {
                        if (this.currentCharacter) {
                            this.autoSave();
                        }
                    });
                }
            });
            
            // Auto-save setup complete
        } catch (error) {
            console.error('Error setting up auto-save:', error);
        }
    }

    // Attribute validation is now handled by the plus/minus buttons
    // No need for change event listeners on spans

    // Show main page
    showMainPage() {
        try {
            // Showing main page...
            const mainPage = document.getElementById('mainPage');
            const characterSheetPage = document.getElementById('characterSheetPage');
            const headerSection = document.getElementById('headerSection');
            
            if (!mainPage || !characterSheetPage) {
                throw new Error('Required page elements not found');
            }
            
            mainPage.style.display = 'block';
            characterSheetPage.style.display = 'none';
            document.getElementById('optionsListPage').style.display = 'none';
            this.currentCharacter = null;
            
            // Add class to body to show footer
            document.body.classList.add('showing-main-page');
            
            // Hide all character sheet sections to ensure clean return to overview
            const characterSheetSections = document.querySelectorAll('[id$="Section"]');
            // Hiding character sheet sections
            characterSheetSections.forEach(section => {
                section.style.display = 'none';
                section.classList.remove('active');
            });
            
            // Show header section on main page
            if (headerSection) {
                headerSection.style.display = 'block';
            }
            
            // Main page displayed, updating character grid...
            this.updateCharacterGrid();
            // Main page setup complete
        } catch (error) {
            console.error('Error showing main page:', error);
            this.showErrorNotification('Failed to show main page: ' + error.message);
        }
    }

    // Show character sheet page
    showCharacterSheetPage(initialMode = 'view') {
        document.getElementById('mainPage').style.display = 'none';
        document.getElementById('characterSheetPage').style.display = 'block';
        
        // Remove class from body to hide footer
        document.body.classList.remove('showing-main-page');
        
        // Reset to stats section when opening character sheet
        this.switchSection('stats');
        
        // Initialize mode state based on parameter
        if (initialMode === 'edit') {
            this.disableViewMode();
        } else {
            this.enableViewMode();
        }
    }

    // Show options list page
    showOptionsListPage() {
        // showOptionsListPage called
        document.getElementById('mainPage').style.display = 'none';
        document.getElementById('optionsListPage').style.display = 'block';
        
        // Remove class from body to hide footer
        document.body.classList.remove('showing-main-page');
        
        // Add a small delay to ensure the page is fully rendered
        setTimeout(() => {
            // Delayed populateAllOptionsList call
            this.populateAllOptionsList();
            // Populate custom boons and banes grids
            this.populateCustomBoonsGrid();
            this.populateCustomBanesGrid();
        }, 100);
    }

    // Switch between character sheet sections
    switchSection(sectionName) {
        try {
            // Check if we're in view mode
            const isViewMode = document.getElementById('characterSheetPage').classList.contains('view-mode');
            
            if (isViewMode) {
                // In view mode, show all sections
                const sections = document.querySelectorAll('[id$="Section"]');
                sections.forEach(section => {
                    section.style.display = 'block';
                    section.classList.add('active');
                });
                
                // Remove active class from all tabs since we're not using navigation
                const tabs = document.querySelectorAll('.nav-tab');
                tabs.forEach(tab => {
                    tab.classList.remove('active');
                });
            } else {
                // Normal edit mode behavior
                // Hide all top-level sections (only those with IDs ending in 'Section')
                const sections = document.querySelectorAll('[id$="Section"]');
                // Top-level sections found
                sections.forEach(section => {
                    section.classList.remove('active');
                    // Force hide with inline style as backup
                    section.style.display = 'none';
                    // Removed active class from section
                });
                
                // Remove active class from all tabs
                const tabs = document.querySelectorAll('.nav-tab');
                // Navigation tabs found
                tabs.forEach(tab => {
                    tab.classList.remove('active');
                });
                
                // Show selected section
                const selectedSection = document.getElementById(sectionName + 'Section');
                if (selectedSection) {
                    selectedSection.classList.add('active');
                    // Force show with inline style as backup
                    selectedSection.style.display = 'block';
                    // Added active class to section
                } else {
                    console.error(`Section not found: ${sectionName}Section`);
                }
                
                // Activate selected tab
                const selectedTab = document.querySelector(`[data-section="${sectionName}"]`);
                if (selectedTab) {
                    selectedTab.classList.add('active');
                    // Added active class to tab
                } else {
                    console.error(`Tab not found for section: ${sectionName}`);
                }
            }
            
            // Special handling for specific sections
            if (sectionName === 'baseActions') {
                this.populateBaseActions();
            } else if (sectionName === 'effects') {
                // Ensure the calculation is updated when the effects section is shown
                setTimeout(() => {
                    this.updateAdvantageDisadvantageCalculation();
                }, 100);
            } else {
                
                // Ensure base actions section is hidden when switching to other sections
                const baseActionsSection = document.getElementById('baseActionsSection');
                if (baseActionsSection) {
                    baseActionsSection.style.display = 'none';
                    console.log('Forced base actions section to be hidden');
                }
            }
            
            
        } catch (error) {
            console.error('Error switching section:', error);
        }
    }

    // Toggle collapsible section
    toggleCollapsibleSection(contentId) {
        const content = document.getElementById(contentId);
        const icon = document.getElementById(contentId.replace('Content', 'Icon'));
        
        if (!content) return;
        
        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            if (icon) icon.classList.remove('collapsed');
        } else {
            content.classList.add('collapsed');
            if (icon) icon.classList.add('collapsed');
        }
    }

    // Update character grid on main page
    updateCharacterGrid() {
        try {
            // Updating character grid...
            const characterGrid = document.getElementById('characterGrid');
            const emptyState = document.getElementById('emptyState');
            
            if (!characterGrid || !emptyState) {
                throw new Error('Character grid elements not found');
            }
            
            // Characters found
            
            if (this.characters.length === 0) {
                characterGrid.style.display = 'none';
                emptyState.style.display = 'block';
                // Showing empty state
            } else {
                characterGrid.style.display = 'grid';
                emptyState.style.display = 'none';
                
                characterGrid.innerHTML = '';
                this.characters.forEach(char => {
                    const charCard = this.createCharacterCard(char);
                    characterGrid.appendChild(charCard);
                });
                // Character grid populated
            }
        } catch (error) {
            console.error('Error updating character grid:', error);
            this.showErrorNotification('Failed to update character grid: ' + error.message);
        }
    }

    // Create character card for main page
    createCharacterCard(character) {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.addEventListener('click', () => this.loadCharacter(character.id));
        
        card.innerHTML = `
            <h3>${character.name}${character.isAlternateForm ? ' <i class="fas fa-magic" title="Alternate Form"></i>' : ''}</h3>
            ${character.archetype ? `<div class="character-overview-archetype">${character.archetype}</div>` : ''}
            ${character.isAlternateForm ? `<div class="character-overview-alternate">Alternate Form (Tier ${character.alternateFormTier})</div>` : ''}
            <div class="character-meta">
                <span>Level ${character.level}</span>
                <span>XP: ${character.experiencePoints}</span>
            </div>
            <div class="character-actions">
                <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); window.app.editCharacter('${character.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-info btn-small" onclick="event.stopPropagation(); window.app.exportSingleCharacter('${character.id}')">
                    <i class="fas fa-download"></i> Export
                </button>
                <button class="btn btn-secondary btn-small" onclick="event.stopPropagation(); window.app.duplicateCharacter('${character.id}')">
                    <i class="fas fa-copy"></i> Duplicate
                </button>
                <button class="btn btn-danger btn-small" onclick="event.stopPropagation(); window.app.deleteCharacter('${character.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        
        return card;
    }

    // Duplicate a character
    duplicateCharacter(characterId) {
        const character = this.characters.find(c => c.id === characterId);
        if (!character) return;
        
        const newChar = {
            ...character,
            id: Date.now().toString(),
            name: `${character.name} (Copy)`,
            createdAt: new Date().toISOString()
        };
        
        this.characters.push(newChar);
        this.saveCharacters();
        this.updateCharacterGrid();
        
        this.showNotification(`Character "${character.name}" duplicated successfully!`, 'success');
    }

    // Create a new character
    createNewCharacter() {
        const name = prompt('Enter character name:');
        if (!name) return;
        
        const newChar = {
            id: Date.now().toString(),
            name: name,
            archetype: '',
            experiencePoints: 0,
            level: 0,
            attributes: {
                agility: 0, fortitude: 0, might: 0, learning: 0, logic: 0, perception: 0, will: 0,
                deception: 0, persuasion: 0, presence: 0, alteration: 0, creation: 0,
                energy: 0, entropy: 0, influence: 0, movement: 0, prescience: 0, protection: 0
            },
            baseMaxHP: 10,
            maxHP: 10,
            currentHP: 10,
            lethalDamage: 0,
            totalDamageTaken: 0,
            wealthScore: 2,
            wealthUsed: false,
            advantages: [],
            disadvantages: [],
            boons: [],
            banes: [],
            feats: [],
            usedFeatPoints: 0,
            equipment: [],
            equippedItems: {
                weapon: null,
                armor: null,
                accessories: []
            },
            movementSpeed: 30,
            legendPoints: 0,
            // swiftWeaponAdvantage removed - no longer needed
            charDescription: '',
            charBackground: '',
            charNotes: '',
            charImage: null,
            perks: [],
            flaws: [],
            createdAt: new Date().toISOString()
        };
        
        this.characters.push(newChar);
        this.saveCharacters();
        this.updateCharacterGrid();
        
        // Load new character in edit mode
        this.currentCharacter = newChar;
        this.showCharacterSheetPage('edit');
        this.displayCharacter();
        
        this.showNotification(`Character "${name}" created successfully!`, 'success');
    }

    // Link companion to its parent character
    linkCompanion(parentCharacter, companion) {
        if (!parentCharacter.companions) {
            parentCharacter.companions = [];
        }
        
        // Add to parent character's companions list
        parentCharacter.companions.push({
            name: companion.name,
            characterId: companion.id,
            tier: companion.companionTier
        });
        
        // Set the companion's reference to the parent character
        companion.companionReferences = parentCharacter.companions;
    }

    // Create companion character for Companion feat
    createCompanionCharacter(companionName, tier) {
        if (!this.currentCharacter) return null;
        
        
        
        
        // Calculate companion attribute points based on tier and character level
        let companionAttributePoints;
        let companionFeatPoints;
        
        if (tier === 1) {
            companionAttributePoints = 20 + (this.currentCharacter.level * 4);
            companionFeatPoints = 0;
            
        } else if (tier === 2) {
            companionAttributePoints = 20 + (this.currentCharacter.level * 4);
            companionFeatPoints = 3;
            
        } else if (tier === 3) {
            companionAttributePoints = 30 + (this.currentCharacter.level * 6);
            companionFeatPoints = 3; // Companion gets 3 feat points, can also use parent's feat points
            
        }
        
        const companionChar = {
            id: Date.now().toString() + '_comp',
            name: companionName,
            archetype: '',
            experiencePoints: this.currentCharacter.experiencePoints, // Same experience as parent
            level: this.currentCharacter.level, // Same level as parent
            attributes: {
                agility: 0, fortitude: 0, might: 0, learning: 0, logic: 0, perception: 0, will: 0,
                deception: 0, persuasion: 0, presence: 0, alteration: 0, creation: 0,
                energy: 0, entropy: 0, influence: 0, movement: 0, prescience: 0, protection: 0
            },
            baseMaxHP: 10,
            maxHP: 10,
            currentHP: 10,
            lethalDamage: 0,
            totalDamageTaken: 0,
            wealthScore: 2,
            wealthUsed: false,
            advantages: [],
            disadvantages: [],
            boons: [],
            banes: [],
            feats: [],
            usedFeatPoints: 0,
            availableFeatPoints: companionFeatPoints,
            availableAttributePoints: companionAttributePoints,
            maxFeatPoints: companionFeatPoints,
            maxAttributePoints: companionAttributePoints,
            equipment: [],
            equippedItems: {
                weapon: null,
                armor: null,
                accessories: []
            },
            movementSpeed: 30,
            legendPoints: 0,
            charDescription: `Companion of ${this.currentCharacter.name}`,
            charBackground: '',
            charNotes: '',
            charImage: null,
            perks: [],
            flaws: [],
            isCompanion: true,
            parentCharacterId: this.currentCharacter.id,
            companionTier: tier,
            createdAt: new Date().toISOString(),
            // Add reference to companions for the parent character
            companionReferences: [],
            featPointsFromParent: 0 // Track feat points received from parent (Tier 3 only)
        };
        
        this.characters.push(companionChar);
        
        // Link the new companion to its parent character
        this.linkCompanion(this.currentCharacter, companionChar);
        
        // Initialize feat point tracking for Tier 3 companions
        if (tier === 3) {
            if (!this.currentCharacter.featPointsSpentOnCompanions) {
                this.currentCharacter.featPointsSpentOnCompanions = 0;
            }
            if (!this.currentCharacter.ownUsedFeatPoints) {
                this.currentCharacter.ownUsedFeatPoints = this.currentCharacter.usedFeatPoints || 0;
            }
        }
        
        // Ensure all characters in the tree are linked for synchronization
        this.linkAllCharactersForSync(companionChar);
        
        // Recalculate companion points to ensure they're correct
        this.recalculateCompanionMaxPoints(companionChar, this.currentCharacter.level);
        companionChar.availableAttributePoints = companionChar.maxAttributePoints;
        companionChar.availableFeatPoints = companionChar.maxFeatPoints;
        
        this.saveCharacters();
        this.updateCharacterGrid();
        
        // Don't switch to the companion character - stay on the parent character
        // The feat will be added to the parent character, not the companion
        
        this.showNotification(`Companion "${companionName}" created successfully!`, 'success');
        return companionChar;
    }

    // Create alternate form character for Alternate Form feat
    createAlternateFormCharacter(alternateFormName, tier) {
        if (!this.currentCharacter) return null;
        
        // Calculate attribute points based on current character's actual available points
        // Use the new functions to get the correct calculation for any character type
        const currentCharacterMaxAttributePoints = this.getCurrentCharacterAvailableAttributePoints();
        const currentCharacterFeatPoints = this.getCurrentCharacterAvailableFeatPoints();
        
        let alternateAttributePoints;
        let alternateFeatPoints;
        
        if (tier === 1) {
            alternateAttributePoints = Math.ceil(currentCharacterMaxAttributePoints / 2);
            alternateFeatPoints = 3;
        } else if (tier === 2) {
            alternateAttributePoints = currentCharacterMaxAttributePoints;
            alternateFeatPoints = Math.max(0, currentCharacterFeatPoints - 3);
        }
        
        const alternateChar = {
            id: Date.now().toString() + '_alt',
            name: alternateFormName,
            archetype: '',
            experiencePoints: this.currentCharacter.experiencePoints, // Same experience as primary
            level: this.currentCharacter.level, // Same level as primary
            attributes: {
                agility: 0, fortitude: 0, might: 0, learning: 0, logic: 0, perception: 0, will: 0,
                deception: 0, persuasion: 0, presence: 0, alteration: 0, creation: 0,
                energy: 0, entropy: 0, influence: 0, movement: 0, prescience: 0, protection: 0
            },
            baseMaxHP: 10,
            maxHP: 10,
            currentHP: 10,
            lethalDamage: 0,
            totalDamageTaken: 0,
            wealthScore: 2,
            wealthUsed: false,
            advantages: [],
            disadvantages: [],
            boons: [],
            banes: [],
            feats: [],
            usedFeatPoints: 0,
            availableFeatPoints: alternateFeatPoints,
            availableAttributePoints: alternateAttributePoints,
            maxFeatPoints: alternateFeatPoints,
            maxAttributePoints: alternateAttributePoints,
            equipment: [],
            equippedItems: {
                weapon: null,
                armor: null,
                accessories: []
            },
            movementSpeed: 30,
            legendPoints: 0,
            charDescription: `Alternate form of ${this.currentCharacter.name}`,
            charBackground: '',
            charNotes: '',
            charImage: null,
            perks: [],
            flaws: [],
            isAlternateForm: true,
            primaryCharacterId: this.currentCharacter.id,
            alternateFormTier: tier,
            createdAt: new Date().toISOString(),
            // Add reference to alternate forms for the primary character
            alternateFormReferences: []
        };
        
        this.characters.push(alternateChar);
        
        // Link for synchronization
        this.linkAllCharactersForSync(alternateChar);
        
        this.saveCharacters();
        this.updateCharacterGrid();
        
        this.showNotification(`Alternate form "${alternateFormName}" created successfully!`, 'success');
        
        return alternateChar;
    }

    // Calculate total attribute points for a character
    calculateTotalAttributePoints() {
        if (!this.currentCharacter) return 0;
        
        let totalPoints = 0;
        Object.values(this.currentCharacter.attributes).forEach(score => {
            totalPoints += score;
        });
        
        return totalPoints;
    }

    // Sync data between primary character and alternate forms
    syncCharacterData(sourceCharacter, targetCharacter) {
        if (!sourceCharacter || !targetCharacter) return;
        
        // Only sync if characters are related (primary/alternate form relationship)
        const areRelated = (
            (sourceCharacter.isAlternateForm && sourceCharacter.primaryCharacterId === targetCharacter.id) ||
            (targetCharacter.isAlternateForm && targetCharacter.primaryCharacterId === sourceCharacter.id) ||
            (sourceCharacter.alternateForms && sourceCharacter.alternateForms.some(alt => alt.characterId === targetCharacter.id)) ||
            (targetCharacter.alternateForms && targetCharacter.alternateForms.some(alt => alt.characterId === sourceCharacter.id))
        );
        
        if (!areRelated) return;
        
        // Sync damage taken (total damage and lethal damage)
        if (sourceCharacter.totalDamageTaken !== undefined) {
            targetCharacter.totalDamageTaken = sourceCharacter.totalDamageTaken;
            // Calculate current HP based on max HP and total damage taken
            targetCharacter.currentHP = Math.max(0, targetCharacter.maxHP - targetCharacter.totalDamageTaken);
        }
        if (sourceCharacter.lethalDamage !== undefined) {
            targetCharacter.lethalDamage = sourceCharacter.lethalDamage;
        }
        
        // Sync legend points
        if (sourceCharacter.legendPoints !== undefined) {
            targetCharacter.legendPoints = sourceCharacter.legendPoints;
        }
        
        // Sync experience points
        if (sourceCharacter.experiencePoints !== undefined) {
            targetCharacter.experiencePoints = sourceCharacter.experiencePoints;
        }
        
        // Sync active boons
        if (sourceCharacter.boons !== undefined) {
            targetCharacter.boons = JSON.parse(JSON.stringify(sourceCharacter.boons));
        }
        
        // Sync active banes
        if (sourceCharacter.banes !== undefined) {
            targetCharacter.banes = JSON.parse(JSON.stringify(sourceCharacter.banes));
        }
        
        // Sync equipment
        if (sourceCharacter.equipment !== undefined) {
            targetCharacter.equipment = JSON.parse(JSON.stringify(sourceCharacter.equipment));
        }
        if (sourceCharacter.equippedItems !== undefined) {
            targetCharacter.equippedItems = JSON.parse(JSON.stringify(sourceCharacter.equippedItems));
        }
        
        // Sync perks
        if (sourceCharacter.perks !== undefined) {
            targetCharacter.perks = JSON.parse(JSON.stringify(sourceCharacter.perks));
        }
        
        // Sync flaws
        if (sourceCharacter.flaws !== undefined) {
            targetCharacter.flaws = JSON.parse(JSON.stringify(sourceCharacter.flaws));
        }
        
        // Save the updated character data
        this.saveCharacters();
        
        
    }

    // Sync damage (HP and lethal damage) to all related characters
    syncDamageToRelatedCharacters() {
        if (!this.currentCharacter) return;
        
        const relatedCharacters = this.getAllRelatedCharactersForSync(this.currentCharacter);
        
        // Debug logging
        console.log(`Syncing damage from ${this.currentCharacter.name} to:`, relatedCharacters.map(c => c.name));
        
        relatedCharacters.forEach(relatedChar => {
            // Sync total damage taken and lethal damage
            if (this.currentCharacter.totalDamageTaken !== undefined) {
                relatedChar.totalDamageTaken = this.currentCharacter.totalDamageTaken;
                // Calculate current HP based on max HP and total damage taken
                relatedChar.currentHP = Math.max(0, relatedChar.maxHP - relatedChar.totalDamageTaken);
            }
            if (this.currentCharacter.lethalDamage !== undefined) {
                relatedChar.lethalDamage = this.currentCharacter.lethalDamage;
            }
        });
        
        if (relatedCharacters.length > 0) {
            this.saveCharacters();
            
        }
    }

    // Get all characters directly related to the given character (for UI switching)
    getRelatedCharacters(character) {
        const related = [];
        const addedIds = new Set(); // Prevent duplicates
        
        if (character.isAlternateForm) {
            // If this is an alternate form, find the primary character
            const primary = this.characters.find(char => char.id === character.primaryCharacterId);
            if (primary && !addedIds.has(primary.id)) {
                related.push(primary);
                addedIds.add(primary.id);
            }
            
            // Find other alternate forms of the same primary (siblings)
            if (primary && primary.alternateForms) {
                primary.alternateForms.forEach(altForm => {
                    const altChar = this.characters.find(char => char.id === altForm.characterId);
                    if (altChar && altChar.id !== character.id && !addedIds.has(altChar.id)) {
                        related.push(altChar);
                        addedIds.add(altChar.id);
                    }
                });
            }
            
            // Find alternate forms of this character (children)
            if (character.alternateForms) {
                character.alternateForms.forEach(altForm => {
                    const altChar = this.characters.find(char => char.id === altForm.characterId);
                    if (altChar && !addedIds.has(altChar.id)) {
                        related.push(altChar);
                        addedIds.add(altChar.id);
                    }
                });
            }
        } else {
            // If this is a primary character, find all direct alternate forms
            if (character.alternateForms) {
                character.alternateForms.forEach(altForm => {
                    const altChar = this.characters.find(char => char.id === altForm.characterId);
                    if (altChar && !addedIds.has(altChar.id)) {
                        related.push(altChar);
                        addedIds.add(altChar.id);
                    }
                });
            }
        }
        
        return related;
    }

    // Get all characters in the entire tree for synchronization purposes
    getAllRelatedCharacters(character) {
        const related = [];
        const visited = new Set();
        
        // Helper function to recursively find all characters in the tree
        const findAllRelated = (currentChar) => {
            if (!currentChar || visited.has(currentChar.id)) return;
            visited.add(currentChar.id);
            
            if (currentChar.isAlternateForm) {
                // Find the primary character
                const primary = this.characters.find(char => char.id === currentChar.primaryCharacterId);
                if (primary) {
                    related.push(primary);
                    findAllRelated(primary);
                }
            }
            
            // Find all alternate forms (recursively)
            if (currentChar.alternateForms) {
                currentChar.alternateForms.forEach(altForm => {
                    const altChar = this.characters.find(char => char.id === altForm.characterId);
                    if (altChar && altChar.id !== character.id) {
                        related.push(altChar);
                        findAllRelated(altChar);
                    }
                });
            }
        };
        
        findAllRelated(character);
        return related;
    }

    // Link all characters in the tree for synchronization purposes
    linkAllCharactersForSync(newCharacter) {
        // Find the root primary character
        let rootPrimary = newCharacter;
        while (rootPrimary.isAlternateForm) {
            rootPrimary = this.characters.find(char => char.id === rootPrimary.primaryCharacterId);
            if (!rootPrimary) break;
        }
        
        if (!rootPrimary) return;
        
        // Ensure the new character is linked to the root primary for sync purposes
        if (!rootPrimary.allRelatedCharacters) {
            rootPrimary.allRelatedCharacters = [];
        }
        
        // Check if this character is already linked
        const existingLink = rootPrimary.allRelatedCharacters.find(link => link.characterId === newCharacter.id);
        if (!existingLink) {
            rootPrimary.allRelatedCharacters.push({
                name: newCharacter.name,
                characterId: newCharacter.id,
                isAlternateForm: newCharacter.isAlternateForm
            });
        }
        
        // Also ensure the new character knows about the root primary
        if (!newCharacter.rootPrimaryForSync) {
            newCharacter.rootPrimaryForSync = rootPrimary.id;
        }
    }

    // Get all characters in the tree for synchronization (using sync links)
    // Note: Companions are excluded from content synchronization as they should be independent
    getAllRelatedCharactersForSync(character) {
        // Find the root primary character
        let rootPrimary = character;
        while (rootPrimary.isAlternateForm) {
            rootPrimary = this.characters.find(char => char.id === rootPrimary.primaryCharacterId);
            if (!rootPrimary) break;
        }
        
        // If the current character is a companion, don't sync content to anyone
        if (character.isCompanion) {
            return [];
        }
        
        if (!rootPrimary) return [];
        
        // Get all characters linked for synchronization, but exclude companions
        const related = [];
        if (rootPrimary.allRelatedCharacters) {
            rootPrimary.allRelatedCharacters.forEach(link => {
                const relatedChar = this.characters.find(char => char.id === link.characterId);
                // Only sync to alternate forms, not to companions
                if (relatedChar && relatedChar.id !== character.id && !relatedChar.isCompanion) {
                    related.push(relatedChar);
                }
            });
        }
        
        return related;
    }

    // Sync boons to all related characters
    syncBoonsToRelatedCharacters() {
        if (!this.currentCharacter) return;
        
        const relatedCharacters = this.getAllRelatedCharactersForSync(this.currentCharacter);
        
        relatedCharacters.forEach(relatedChar => {
            if (this.currentCharacter.boons !== undefined) {
                relatedChar.boons = JSON.parse(JSON.stringify(this.currentCharacter.boons));
            }
        });
        
        if (relatedCharacters.length > 0) {
            this.saveCharacters();
            
        }
    }

    // Sync banes to all related characters
    syncBanesToRelatedCharacters() {
        if (!this.currentCharacter) return;
        
        const relatedCharacters = this.getAllRelatedCharactersForSync(this.currentCharacter);
        
        relatedCharacters.forEach(relatedChar => {
            if (this.currentCharacter.banes !== undefined) {
                relatedChar.banes = JSON.parse(JSON.stringify(this.currentCharacter.banes));
            }
        });
        
        if (relatedCharacters.length > 0) {
            this.saveCharacters();
            
        }
    }

    // Sync equipment to all related characters
    syncEquipmentToRelatedCharacters() {
        if (!this.currentCharacter) return;
        
        const relatedCharacters = this.getAllRelatedCharactersForSync(this.currentCharacter);
        
        relatedCharacters.forEach(relatedChar => {
            if (this.currentCharacter.equipment !== undefined) {
                relatedChar.equipment = JSON.parse(JSON.stringify(this.currentCharacter.equipment));
            }
            if (this.currentCharacter.equippedItems !== undefined) {
                relatedChar.equippedItems = JSON.parse(JSON.stringify(this.currentCharacter.equippedItems));
            }
        });
        
        if (relatedCharacters.length > 0) {
            this.saveCharacters();
            
        }
    }

    // Sync perks to all related characters
    syncPerksToRelatedCharacters() {
        if (!this.currentCharacter) return;
        
        const relatedCharacters = this.getAllRelatedCharactersForSync(this.currentCharacter);
        
        relatedCharacters.forEach(relatedChar => {
            if (this.currentCharacter.perks !== undefined) {
                relatedChar.perks = JSON.parse(JSON.stringify(this.currentCharacter.perks));
            }
        });
        
        if (relatedCharacters.length > 0) {
            this.saveCharacters();
            
        }
    }

    // Sync flaws to all related characters
    syncFlawsToRelatedCharacters() {
        if (!this.currentCharacter) return;
        
        const relatedCharacters = this.getAllRelatedCharactersForSync(this.currentCharacter);
        
        relatedCharacters.forEach(relatedChar => {
            if (this.currentCharacter.flaws !== undefined) {
                relatedChar.flaws = JSON.parse(JSON.stringify(this.currentCharacter.flaws));
            }
        });
        
        if (relatedCharacters.length > 0) {
            this.saveCharacters();
            
        }
    }

    // Sync legend points to all related characters
    syncLegendPointsToRelatedCharacters() {
        if (!this.currentCharacter) return;
        
        const relatedCharacters = this.getAllRelatedCharactersForSync(this.currentCharacter);
        
        relatedCharacters.forEach(relatedChar => {
            if (this.currentCharacter.legendPoints !== undefined) {
                relatedChar.legendPoints = this.currentCharacter.legendPoints;
            }
        });
        
        if (relatedCharacters.length > 0) {
            this.saveCharacters();
            
        }
    }

    // Get actual available attribute points for any character
    getCharacterAvailableAttributePoints(character) {
        if (!character) return 0;
        
        if (character.isAlternateForm && character.maxAttributePoints !== undefined) {
            // Alternate form: use the stored maximum
            return character.maxAttributePoints;
        } else if (character.isCompanion && character.maxAttributePoints !== undefined) {
            // Companion: use the stored maximum (calculated based on tier and parent level)
            return character.maxAttributePoints;
        } else {
            // Primary form: normal calculation
            return 40 + (character.experiencePoints * 3);
        }
    }

    // Get correct available attribute points for current character (handles alternate forms properly)
    getCurrentCharacterAvailableAttributePoints() {
        if (!this.currentCharacter) return 0;
        const result = this.getCharacterAvailableAttributePoints(this.currentCharacter);
        
        return result;
    }

    // Get actual available feat points for any character
    getCharacterAvailableFeatPoints(character) {
        if (!character) return 0;
        
        if (character.isAlternateForm && character.maxFeatPoints !== undefined) {
            // Alternate form: use the stored maximum
            return character.maxFeatPoints;
        } else if (character.isCompanion && character.maxFeatPoints !== undefined) {
            // Companion: use the stored maximum (calculated based on tier)
            // For Tier 3 companions, add available parent feat points
            if (character.companionTier === 3) {
                const parent = this.characters.find(char => char.id === character.parentCharacterId);
                if (parent) {
                    const parentBasePoints = 6 + parent.experiencePoints;
                    const parentOwnUsedPoints = parent.ownUsedFeatPoints || 0;
                    const parentAvailableForCompanion = parentBasePoints - parentOwnUsedPoints;
                    const companionOwnPoints = character.maxFeatPoints;
                    // Companion can use their own points + parent's available points (total - parent's own used)
                    return companionOwnPoints + Math.max(0, parentAvailableForCompanion);
                }
                return character.maxFeatPoints;
            } else {
                return character.maxFeatPoints;
            }
        } else {
            // Primary form: normal calculation
            return 6 + character.experiencePoints;
        }
    }

    // Get correct available feat points for current character (handles alternate forms properly)
    getCurrentCharacterAvailableFeatPoints() {
        if (!this.currentCharacter) return 0;
        return this.getCharacterAvailableFeatPoints(this.currentCharacter);
    }

    // Recalculate max points for alternate forms based on their parent's actual available points
    recalculateAlternateFormMaxPoints(character) {
        if (!character.isAlternateForm) return;
        
        
        
        // Find the parent character
        const parent = this.characters.find(char => char.id === character.primaryCharacterId);
        if (!parent) {
            
            return;
        }
        
        
        
        // Get parent's actual available points (the displayed/used values)
        const parentAvailableAttributePoints = this.getCharacterAvailableAttributePoints(parent);
        const parentAvailableFeatPoints = this.getCharacterAvailableFeatPoints(parent);
        
        
        
        // Calculate based on tier using parent's actual available points
        if (character.alternateFormTier === 1) {
            character.maxAttributePoints = Math.ceil(parentAvailableAttributePoints / 2);
            character.maxFeatPoints = 3;
            
        } else if (character.alternateFormTier === 2) {
            character.maxAttributePoints = parentAvailableAttributePoints;
            character.maxFeatPoints = Math.max(0, parentAvailableFeatPoints - 3);
            
        }
        
        
    }

    // Recalculate max points for companions based on their tier and parent's level
    recalculateCompanionMaxPoints(character, parentLevel) {
        if (!character.isCompanion) return;
        
        
        
        // Calculate based on tier and parent's level
        if (character.companionTier === 1) {
            character.maxAttributePoints = 20 + (parentLevel * 4);
            character.maxFeatPoints = 0;
            
        } else if (character.companionTier === 2) {
            character.maxAttributePoints = 20 + (parentLevel * 4);
            character.maxFeatPoints = 3;
            
        } else if (character.companionTier === 3) {
            character.maxAttributePoints = 30 + (parentLevel * 6);
            character.maxFeatPoints = 3; // Companion gets 3 feat points, can also use parent's feat points
            
        }
        
        
    }

    // Recalculate all alternate forms in the hierarchy in the correct order
    recalculateAllAlternateFormsInHierarchy() {
        // Find the root primary character
        let rootPrimary = this.currentCharacter;
        while (rootPrimary.isAlternateForm) {
            rootPrimary = this.characters.find(char => char.id === rootPrimary.primaryCharacterId);
            if (!rootPrimary) break;
        }
        
        if (!rootPrimary) return;
        
        // Get all characters in the hierarchy
        const hierarchyCharacters = this.getAllCharactersInHierarchy(rootPrimary);
        
        // Sort by tier (primary first, then tier 1, then tier 2, etc.)
        hierarchyCharacters.sort((a, b) => {
            const aTier = a.isAlternateForm ? a.alternateFormTier : 0;
            const bTier = b.isAlternateForm ? b.alternateFormTier : 0;
            return aTier - bTier;
        });
        
        // Recalculate each character in order
        hierarchyCharacters.forEach(character => {
            if (character.isAlternateForm) {
                this.recalculateAlternateFormMaxPoints(character);
            }
        });
    }

    // Get all characters in a hierarchy (root + all alternate forms + all companions)
    getAllCharactersInHierarchy(rootCharacter) {
        const characters = [rootCharacter];
        
        // Find all alternate forms of the root character
        this.characters.forEach(char => {
            if (char.isAlternateForm && char.primaryCharacterId === rootCharacter.id) {
                characters.push(char);
                // Recursively find alternate forms of this alternate form
                const subAlternates = this.getAllCharactersInHierarchy(char);
                characters.push(...subAlternates.filter(sub => sub.id !== char.id));
            }
        });
        
        // Find all companions of the root character
        this.characters.forEach(char => {
            if (char.isCompanion && char.parentCharacterId === rootCharacter.id) {
                characters.push(char);
                // Recursively find alternate forms and companions of this companion
                const subCharacters = this.getAllCharactersInHierarchy(char);
                characters.push(...subCharacters.filter(sub => sub.id !== char.id));
            }
        });
        
        return characters;
    }

    // Sync experience points to all related characters
    syncExperiencePointsToRelatedCharacters() {
        if (!this.currentCharacter) return;
        
        // Sync to alternate forms (full content sync)
        const relatedCharacters = this.getAllRelatedCharactersForSync(this.currentCharacter);
        
        relatedCharacters.forEach(relatedChar => {
            if (this.currentCharacter.experiencePoints !== undefined) {
                relatedChar.experiencePoints = this.currentCharacter.experiencePoints;
                // Update level and point calculations for the related character
                relatedChar.level = 1 + Math.floor(relatedChar.experiencePoints / 3);
            }
        });
        
        // Sync to companions (experience only for level calculations)
        this.syncExperienceToCompanions();
        
        // Recalculate all alternate forms in the correct order (parents first, then children)
        this.recalculateAllAlternateFormsInHierarchy();
        
        // Recalculate all companions
        this.recalculateAllCompanions();
        
        if (relatedCharacters.length > 0) {
            this.saveCharacters();
            
        }
    }

    // Sync experience points to companions (for level calculations only)
    syncExperienceToCompanions() {
        if (!this.currentCharacter) return;
        
        // Find all companions of the current character
        const companions = this.characters.filter(char => 
            char.isCompanion && char.parentCharacterId === this.currentCharacter.id
        );
        
        companions.forEach(companion => {
            if (this.currentCharacter.experiencePoints !== undefined) {
                companion.experiencePoints = this.currentCharacter.experiencePoints;
                // Update level for companion (affects companion point calculations)
                companion.level = 1 + Math.floor(companion.experiencePoints / 3);
            }
        });
        
        if (companions.length > 0) {
            this.saveCharacters();
            
        }
    }

    // Recalculate all companions in the hierarchy
    recalculateAllCompanions() {
        if (!this.currentCharacter) return;
        
        // Find all companions of the current character
        const companions = this.characters.filter(char => 
            char.isCompanion && char.parentCharacterId === this.currentCharacter.id
        );
        
        // Recalculate each companion
        companions.forEach(companion => {
            this.recalculateCompanionMaxPoints(companion, this.currentCharacter.level);
            // Update available points to match max points
            companion.availableAttributePoints = companion.maxAttributePoints;
            companion.availableFeatPoints = companion.maxFeatPoints;
        });
    }

    // Migrate damage tracking for existing characters
    migrateDamageTracking() {
        if (!this.currentCharacter) return;
        
        // Initialize totalDamageTaken if it doesn't exist
        if (this.currentCharacter.totalDamageTaken === undefined) {
            // Calculate total damage taken based on current HP
            this.currentCharacter.totalDamageTaken = Math.max(0, this.currentCharacter.maxHP - this.currentCharacter.currentHP);
            
        }
    }

    // Update alternate form switch buttons
    updateAlternateFormSwitch() {
        const switchSection = document.getElementById('alternateFormSwitchSection');
        const switchButtons = document.getElementById('alternateFormSwitchButtons');
        
        if (!switchSection || !switchButtons || !this.currentCharacter) {
            if (switchSection) {
                switchSection.style.setProperty('display', 'none', 'important');
            }
            return;
        }
        
        // Clear buttons first
        switchButtons.innerHTML = '';
        
        // Check if character has Alternate Form feat or is an alternate form
        const hasAlternateFormFeat = this.currentCharacter.feats && 
            this.currentCharacter.feats.some(feat => feat.name === 'Alternate Form');
        const isAlternateForm = this.currentCharacter.isAlternateForm;
        
        // Get related characters (alternate forms or primary form)
        const relatedCharacters = this.getRelatedCharacters(this.currentCharacter);
        
        // Show section if character has alternate forms OR is an alternate form
        if ((hasAlternateFormFeat || isAlternateForm) && relatedCharacters.length > 0) {
            switchSection.style.setProperty('display', 'block', 'important');
            
            // Populate buttons for related characters
            relatedCharacters.forEach(relatedChar => {
                const button = document.createElement('button');
                
                if (relatedChar.isAlternateForm) {
                    button.className = 'switch-button alternate-form';
                    button.innerHTML = `<i class="fas fa-magic"></i> Switch to ${relatedChar.name}`;
                } else {
                    button.className = 'switch-button primary-form';
                    button.innerHTML = `<i class="fas fa-user"></i> Switch to ${relatedChar.name}`;
                }
                
                button.onclick = () => this.switchToCharacter(relatedChar.id);
                switchButtons.appendChild(button);
            });
        } else {
            // Hide section if no alternate forms
            switchSection.style.setProperty('display', 'none', 'important');
        }
    }

    // Update companion switch buttons
    updateCompanionSwitch() {
        const switchSection = document.getElementById('companionSwitchSection');
        const switchButtons = document.getElementById('companionSwitchButtons');
        
        if (!switchSection || !switchButtons || !this.currentCharacter) {
            if (switchSection) {
                switchSection.style.setProperty('display', 'none', 'important');
            }
            return;
        }
        
        // Clear buttons first
        switchButtons.innerHTML = '';
        
        // Check if character has Companion feat or is a companion
        const hasCompanionFeat = this.currentCharacter.feats && 
            this.currentCharacter.feats.some(feat => feat.name === 'Companion');
        const isCompanion = this.currentCharacter.isCompanion;
        
        // Get related characters (companions or parent)
        const relatedCharacters = this.getCompanionRelatedCharacters(this.currentCharacter);
        
        // Show section if character has companions OR is a companion
        if ((hasCompanionFeat || isCompanion) && relatedCharacters.length > 0) {
            switchSection.style.setProperty('display', 'block', 'important');
            
            // Populate buttons for related characters
            relatedCharacters.forEach(relatedChar => {
                const button = document.createElement('button');
                
                if (relatedChar.isCompanion) {
                    button.className = 'switch-button companion';
                    button.innerHTML = `<i class="fas fa-paw"></i> Switch to ${relatedChar.name}`;
                } else {
                    button.className = 'switch-button parent';
                    button.innerHTML = `<i class="fas fa-user"></i> Switch to ${relatedChar.name}`;
                }
                
                button.onclick = () => this.switchToCharacter(relatedChar.id);
                switchButtons.appendChild(button);
            });
        } else {
            // Hide section if no companions
            switchSection.style.setProperty('display', 'none', 'important');
        }
    }

    // Get companion-related characters (parent and companions)
    getCompanionRelatedCharacters(character) {
        const relatedCharacters = [];
        
        if (!character) return relatedCharacters;
        
        // If this is a companion, only add its parent (not other companions)
        if (character.isCompanion && character.parentCharacterId) {
            const parent = this.characters.find(char => char.id === character.parentCharacterId);
            if (parent) {
                relatedCharacters.push(parent);
            }
        }
        // If this character has companions (is a parent), only add its companions (not other parents)
        else if (character.companions && character.companions.length > 0) {
            character.companions.forEach(companionRef => {
                const companion = this.characters.find(char => char.id === companionRef.characterId);
                if (companion) {
                    relatedCharacters.push(companion);
                }
            });
        }
        
        return relatedCharacters;
    }

    // Switch to a different character (primary or alternate form)
    switchToCharacter(characterId) {
        const targetCharacter = this.characters.find(char => char.id === characterId);
        if (!targetCharacter) return;
        
        // Sync data from current character to target character before switching
        this.syncCharacterData(this.currentCharacter, targetCharacter);
        
        // Load the target character
        this.currentCharacter = targetCharacter;
        
        // If switching to an alternate form, ensure its points are up to date
        if (targetCharacter.isAlternateForm) {
            
            
            
            // Only recalculate if the values seem outdated
            // Check if available points match max points (indicates they were recently updated)
            const needsRecalculation = targetCharacter.availableAttributePoints !== targetCharacter.maxAttributePoints ||
                                    targetCharacter.availableFeatPoints !== targetCharacter.maxFeatPoints;
            
            if (needsRecalculation) {
                
                this.recalculateAlternateFormMaxPoints(targetCharacter);
                // Update available points to match max points
                targetCharacter.availableAttributePoints = targetCharacter.maxAttributePoints;
                targetCharacter.availableFeatPoints = targetCharacter.maxFeatPoints;
            } else {
                
            }
        }
        
        // Ensure we're on the character sheet page
        this.showCharacterSheetPage('view');
        
        // Display the character data
        this.displayCharacter();
        
        // Update the switch buttons for the new character
        this.updateAlternateFormSwitch();
        this.updateCompanionSwitch();
        
        this.showNotification(`Switched to ${targetCharacter.name}`, 'success');
    }

    // Load a character by ID
    loadCharacter(characterId) {
        if (!characterId) return;
        
        // Stop validation for previous character
        this.stopPeriodicValidation();
        
        this.currentCharacter = this.characters.find(c => c.id === characterId);
        if (this.currentCharacter) {
            this.showCharacterSheetPage('view');
            this.displayCharacter();
            
            // Refresh available boons and banes after character is loaded
            setTimeout(() => this.populateAvailableBoonsAndBanes(), 200);
        }
    }

    // Edit character (same as load but more explicit)
    editCharacter(characterId) {
        if (!characterId) return;
        
        // Stop validation for previous character
        this.stopPeriodicValidation();
        
        this.currentCharacter = this.characters.find(c => c.id === characterId);
        if (this.currentCharacter) {
            this.showCharacterSheetPage('edit');
            this.displayCharacter();
            
            // Refresh available boons and banes after character is loaded
            setTimeout(() => this.populateAvailableBoonsAndBanes(), 200);
        }
    }

    // Display the current character
    displayCharacter() {
        if (!this.currentCharacter) return;
        
        // Fill in basic info
        const charNameEl = document.getElementById('charName');
        if (charNameEl) charNameEl.value = this.currentCharacter.name;
        
        const charArchetypeEl = document.getElementById('charArchetype');
        if (charArchetypeEl) charArchetypeEl.value = this.currentCharacter.archetype || '';
        
        const experiencePointsEl = document.getElementById('experiencePoints');
        if (experiencePointsEl) experiencePointsEl.value = this.currentCharacter.experiencePoints;
        
        const sheetCharNameEl = document.getElementById('sheetCharName');
        if (sheetCharNameEl) sheetCharNameEl.textContent = this.currentCharacter.name;
        
        const sheetCharArchetypeEl = document.getElementById('sheetCharArchetype');
        if (sheetCharArchetypeEl) sheetCharArchetypeEl.textContent = this.currentCharacter.archetype || 'Archetype';
        
        const sheetCharLevelEl = document.getElementById('sheetCharLevel');
        if (sheetCharLevelEl) sheetCharLevelEl.textContent = this.currentCharacter.level;
        
        const sheetExpPointsEl = document.getElementById('sheetExpPoints');
        if (sheetExpPointsEl) sheetExpPointsEl.textContent = this.currentCharacter.experiencePoints;
        
        // Fill in attributes
        // Loading character attributes...
        
        // Migrate old attribute structure if needed
        this.migrateCharacterAttributes();
        
        // Migrate damage tracking if needed
        this.migrateDamageTracking();
        
        Object.keys(this.currentCharacter.attributes).forEach(attr => {
            const element = document.getElementById(attr);
            const scoreElement = document.getElementById(`${attr}Score`);
            
            if (element) {
                element.textContent = this.currentCharacter.attributes[attr];
            } else {
                console.warn(`No element found for attribute: ${attr}`);
            }
            
            if (scoreElement) {
                scoreElement.textContent = this.currentCharacter.attributes[attr];
            }
        });
        
        // Fill in other fields
        const wealthScoreEl = document.getElementById('viewWealthScore');
        if (wealthScoreEl) wealthScoreEl.value = this.currentCharacter.wealthScore || 0;
        
        const wealthUsedEl = document.getElementById('viewWealthUsed');
        if (wealthUsedEl) wealthUsedEl.checked = this.currentCharacter.wealthUsed || false;
        
        const charDescriptionEl = document.getElementById('charDescription');
        if (charDescriptionEl) charDescriptionEl.value = this.currentCharacter.charDescription || '';
        
        const charBackgroundEl = document.getElementById('charBackground');
        if (charBackgroundEl) charBackgroundEl.value = this.currentCharacter.charBackground || '';
        
        const charNotesEl = document.getElementById('charNotes');
        if (charNotesEl) charNotesEl.value = this.currentCharacter.charNotes || '';
        
        // Setup view mode wealth controls
        this.setupViewModeWealthControls();
        
        // Display character image
        this.displayCharacterImage();
        
        // Populate combat stats
        document.getElementById('movementSpeed').textContent = this.currentCharacter.movementSpeed || 30;
        document.getElementById('legendPoints').textContent = this.currentCharacter.legendPoints || 0;
        // swiftWeaponAdvantage removed - no longer needed
        
        // Update movement and initiative displays
        this.updateMovementStats();
        this.updateInitiative();
        this.updateWeaponAdvantageDisplay(); // Update weapon advantage display
        
        // Migrate old featPoints property to usedFeatPoints if needed
        if (this.currentCharacter.featPoints !== undefined && this.currentCharacter.usedFeatPoints === undefined) {
            this.currentCharacter.usedFeatPoints = this.currentCharacter.featPoints;
            delete this.currentCharacter.featPoints;
        }
        
        // Ensure usedFeatPoints is initialized
        if (this.currentCharacter.usedFeatPoints === undefined) {
            this.currentCharacter.usedFeatPoints = 0;
        }
        
        // Migrate old character data structure for new fields
        if (this.currentCharacter.charNotes === undefined) {
            this.currentCharacter.charNotes = '';
        }
        if (this.currentCharacter.charImage === undefined) {
            this.currentCharacter.charImage = null;
        }
        if (this.currentCharacter.movementSpeed === undefined) {
            this.currentCharacter.movementSpeed = 30;
        }
        if (this.currentCharacter.legendPoints === undefined) {
            this.currentCharacter.legendPoints = 0;
        }
        if (this.currentCharacter.customHealthBuff === undefined) {
            this.currentCharacter.customHealthBuff = 0;
        }
        if (this.currentCharacter.manualSettings === undefined) {
            this.currentCharacter.manualSettings = false;
        }
        if (this.currentCharacter.favoriteActions === undefined) {
            this.currentCharacter.favoriteActions = [];
        }
        // swiftWeaponAdvantage removed - no longer needed

        
        // Restore custom health buff value
        const customHealthBuffEl = document.getElementById('customHealthBuff');
        if (customHealthBuffEl) {
            customHealthBuffEl.value = this.currentCharacter.customHealthBuff || 0;
        }
        
        // Restore manual settings state
        const manualSettingsToggleEl = document.getElementById('manualSettingsToggle');
        if (manualSettingsToggleEl) {
            manualSettingsToggleEl.checked = this.currentCharacter.manualSettings || false;
            if (this.currentCharacter.manualSettings) {
                this.showManualInputs();
            } else {
                this.hideManualInputs();
            }
        }
        
        // Update displays
        this.updateExperienceAndLevel();
        this.updateAttributeDisplays();
        this.updateAttributeDisplay(); // Update to show effective scores including equipment
        this.updateHPDisplay();
        this.updateDefenseStats();
        this.updateFeatPointsDisplay();
        
        // Validate all attributes to ensure they don't exceed limits
        this.validateAllAttributes();
        
        this.populateAdvantages();
        this.populateDisadvantages();
        this.populateBoons();
        this.populateBanes();
        this.populateFeats();
        this.populateFeatsDropdown(); // Refresh available feats dropdown
        
        // Update feat icons
        this.updateFeatIcons();
        this.populatePerks();
        this.populateFlaws();
        this.populateFavoriteActions();
        this.populateEquipment();
        this.updateWealthDisplay(); // Update wealth display to include feat bonuses
        
        // Refresh base actions to show feat notes if character has relevant feats
        if (this.hasFeatsAffectingBaseActions()) {
            this.populateBaseActions();
        }
        
        // Ensure advantage/disadvantage calculation is updated after all population
        setTimeout(() => {
            this.updateAdvantageDisadvantageCalculation();
        }, 100);
        this.populateAvailableBoonsAndBanes();
        
        // Ensure boons and banes are refreshed after all updates
        setTimeout(() => this.populateAvailableBoonsAndBanes(), 100);
        
        // Validate boons and banes for data integrity when character is loaded
        setTimeout(() => this.validateBoonsAndBanes(), 200);
        
        // Set up periodic validation every 5 minutes
        this.startPeriodicValidation();
        
        // Update alternate form switch buttons
        this.updateAlternateFormSwitch();
        this.updateCompanionSwitch();
        
        document.getElementById('characterSheetPage').classList.add('fade-in');
    }

    // Update experience and level
    updateExperienceAndLevel() {
        if (!this.currentCharacter) return;
        
        const exp = parseInt(document.getElementById('experiencePoints').value) || 0;
        this.currentCharacter.experiencePoints = exp;
        
        // Calculate level (1 + XP/3 rounded down)
        const level = 1 + Math.floor(exp / 3);
        this.currentCharacter.level = level;
        
        // Calculate available attribute points (respect alternate form limitations)
        const availableAttributePoints = this.getCurrentCharacterAvailableAttributePoints();
        
        // Update displays
        document.getElementById('availableAttributePoints').textContent = availableAttributePoints;
        document.getElementById('sheetCharLevel').textContent = level;
        document.getElementById('sheetExpPoints').textContent = exp;
        
        // Update attribute max values based on level
        this.updateAttributeMaxValues();
        this.updateAttributeDisplays();
        this.updateFeatPointsDisplay();
        this.updateDefenseStats();
        this.updateMaxHP();
        
        // Sync XP changes to related characters
        this.syncExperiencePointsToRelatedCharacters();
        
        this.autoSave();
    }

    // Get maximum attribute value based on current character level
    getMaxAttributeValue() {
        if (!this.currentCharacter) return 5;
        
        const level = this.currentCharacter.level;
        let maxAttribute = 5; // Default for level 0-2
        
        if (level >= 3 && level <= 4) maxAttribute = 6;
        else if (level >= 5 && level <= 6) maxAttribute = 7;
        else if (level >= 7 && level <= 8) maxAttribute = 8;
        else if (level >= 9) maxAttribute = 9;
        
        return maxAttribute;
    }

    // Toggle category expansion for Options List page
    toggleCategoryList(categoryName) {
        const content = document.getElementById(`${categoryName}Content`);
        const header = content.previousElementSibling;
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            header.classList.add('expanded');
        } else {
            content.style.display = 'none';
            header.classList.remove('expanded');
        }
    }

    // Populate all options from the database (for Options List page)
    populateAllOptionsList() {
        // populateAllOptionsList called
        
        if (!window.GAME_DATABASE) {
            console.error('Game database not available');
            return;
        }

        // Game database found, populating options list...
        this.populateBoonsList();
        this.populateBanesList();
        this.populateFeatsList();
        this.populatePerksList();
        this.populateFlawsList();
    }

    // Populate boons for Options List page
    populateBoonsList() {
        // populateBoonsList called
        const grid = document.getElementById('boonsGrid');
        
        if (!grid) {
            console.error('boonsGrid element not found');
            return;
        }
        
        if (!window.GAME_DATABASE.boons) {
            console.error('No boons in database');
            return;
        }

        // Populating boons in list
        grid.innerHTML = '';
        
        // Sort boons alphabetically by name
        const sortedBoons = this.sortItemsAlphabetically(window.GAME_DATABASE.boons);
        
        sortedBoons.forEach((boon, index) => {
            // Creating boon list item
            const boonElement = this.createBoonOptionElementList(boon);
            grid.appendChild(boonElement);
        });
    }

    // Populate banes for Options List page
    populateBanesList() {
        // populateBanesList called
        const grid = document.getElementById('banesGrid');
        
        if (!grid) {
            console.error('banesGrid element not found');
            return;
        }
        
        if (!window.GAME_DATABASE.banes) {
            console.error('No banes in database');
            return;
        }

        // Populating banes in list
        grid.innerHTML = '';
        
        // Sort banes alphabetically by name
        const sortedBanes = this.sortItemsAlphabetically(window.GAME_DATABASE.banes);
        
        sortedBanes.forEach((bane, index) => {
            // Creating bane list item
            const baneElement = this.createBaneOptionElementList(bane);
            grid.appendChild(baneElement);
        });
    }

    // Populate feats for Options List page
    populateFeatsList() {
        // populateFeatsList called
        const grid = document.getElementById('featsGrid');
        
        if (!grid) {
            console.error('featsGrid element not found');
            return;
        }
        
        if (!window.GAME_DATABASE.feats) {
            console.error('No feats in database');
            return;
        }

        // Populating feats in list
        grid.innerHTML = '';
        
        // Sort feats alphabetically by name
        const sortedFeats = this.sortItemsAlphabetically(window.GAME_DATABASE.feats);
        
        sortedFeats.forEach((feat, index) => {
            // Creating feat list item
            const featElement = this.createFeatOptionElementList(feat);
            grid.appendChild(featElement);
        });
    }

    // Populate perks for Options List page
    populatePerksList() {
        // populatePerksList called
        const grid = document.getElementById('perksGrid');
        
        if (!grid) {
            console.error('perksGrid element not found');
            return;
        }
        
        if (!window.GAME_DATABASE.perks) {
            console.error('No perks in database');
            return;
        }

        // Populating perks in list
        grid.innerHTML = '';
        
        // Sort perks alphabetically by name
        const sortedPerks = this.sortItemsAlphabetically(window.GAME_DATABASE.perks);
        
        sortedPerks.forEach((perk, index) => {
            // Creating perk list item
            const perkElement = this.createPerkOptionElementList(perk);
            grid.appendChild(perkElement);
        });
    }

    // Populate flaws for Options List page
    populateFlawsList() {
        // populateFlawsList called
        const grid = document.getElementById('flawsGrid');
        
        if (!grid) {
            console.error('flawsGrid element not found');
            return;
        }
        
        if (!window.GAME_DATABASE.flaws) {
            console.error('No flaws in database');
            return;
        }

        // Populating flaws in list
        grid.innerHTML = '';
        
        // Sort flaws alphabetically by name
        const sortedFlaws = this.sortItemsAlphabetically(window.GAME_DATABASE.flaws);
        
        sortedFlaws.forEach((flaw, index) => {
            // Creating flaw list item
            const flawElement = this.createFlawOptionElementList(flaw);
            grid.appendChild(flawElement);
        });
    }

    // Create boon option element for Options List page
    createBoonOptionElementList(boon) {
        const div = document.createElement('div');
        div.className = 'option-item boon-item';
        div.onclick = () => this.toggleOptionDetailsList(div, 'boon');
        
        const attributes = boon.attributes.map(attr => attr.charAt(0).toUpperCase() + attr.slice(1)).join(', ');
        
        div.innerHTML = `
            <div class="option-header">
                <h4 class="option-name">${boon.name}</h4>
                <div class="option-meta">
                    <span class="option-badge">PL ${boon.powerLevels.join(', ')}</span>
                </div>
            </div>
            <div class="option-attributes">${attributes}</div>
            <div class="option-description">${boon.generalDescription || 'No description available'}</div>
            <div class="option-details" style="display: none;">
                ${boon.effectDescription ? `
                <h6>Effect Description</h6>
                <p>${boon.effectDescription}</p>
                ` : ''}
                ${boon.invocationTime ? `
                <h6>Invocation Time</h6>
                <p>${boon.invocationTime}</p>
                ` : ''}
                ${boon.duration ? `
                <h6>Duration</h6>
                <p>${boon.duration}</p>
                ` : ''}
                ${boon.powerLevelDescriptions && Object.keys(boon.powerLevelDescriptions).length > 0 ? `
                <h6>Power Levels</h6>
                <div class="power-levels-details">
                    ${boon.powerLevels.map(pl => {
                        const plDesc = boon.powerLevelDescriptions[pl] 
                            ? boon.powerLevelDescriptions[pl].description 
                            : 'No specific description for this power level.';
                        return `<div class="power-level-item"><strong>PL ${pl}:</strong> ${plDesc}</div>`;
                    }).join('')}
                </div>
                ` : ''}
                ${boon.specialText ? `
                <h6>Special</h6>
                <p>${boon.specialText}</p>
                ` : ''}
            </div>
        `;
        
        return div;
    }

    // Create bane option element for Options List page
    createBaneOptionElementList(bane) {
        const div = document.createElement('div');
        div.className = 'option-item bane-item';
        div.onclick = () => this.toggleOptionDetailsList(div, 'bane');
        
        const attributes = bane.attributes.map(attr => attr.charAt(0).toUpperCase() + attr.slice(1)).join(', ');
        
        div.innerHTML = `
            <div class="option-header">
                <h4 class="option-name">${bane.name}</h4>
                <div class="option-meta">
                    <span class="option-badge">PL ${bane.powerLevels.join(', ')}</span>
                </div>
            </div>
            <div class="option-attributes">${bane.attributes.join(', ')}</div>
            <div class="option-description">${bane.generalDescription || 'No description available'}</div>
            <div class="option-details" style="display: none;">
                ${bane.effectDescription ? `
                <h6>Effect Description</h6>
                <p>${bane.effectDescription}</p>
                ` : ''}
                ${bane.duration ? `
                <h6>Duration</h6>
                <p>${bane.duration}</p>
                ` : ''}
                ${bane.defenseTargets && Object.keys(bane.defenseTargets).length > 0 ? `
                <h6>Defense Targets</h6>
                <div class="defense-targets-details">
                    ${Object.entries(bane.defenseTargets).map(([attr, defense]) => 
                        `<div class="defense-target-item"><strong>${attr.charAt(0).toUpperCase() + attr.slice(1)}:</strong> ${defense.charAt(0).toUpperCase() + defense.slice(1)}</div>`
                    ).join('')}
                </div>
                ` : ''}
                ${bane.powerLevelDescriptions && Object.keys(bane.powerLevelDescriptions).length > 0 ? `
                <h6>Power Levels</h6>
                <div class="power-levels-details">
                    ${bane.powerLevels.map(pl => {
                        const plDesc = bane.powerLevelDescriptions[pl] 
                            ? bane.powerLevelDescriptions[pl].description 
                            : 'No specific description for this power level.';
                        return `<div class="power-level-item"><strong>PL ${pl}:</strong> ${plDesc}</div>`;
                    }).join('')}
                </div>
                ` : ''}
                ${bane.specialText ? `
                <h6>Special</h6>
                <p>${bane.specialText}</p>
                ` : ''}
            </div>
        `;
        
        return div;
    }

    // Create feat option element for Options List page
    createFeatOptionElementList(feat) {
        const div = document.createElement('div');
        div.className = 'option-item feat-item';
        div.onclick = () => this.toggleOptionDetailsList(div, 'feat');
        
        div.innerHTML = `
            <div class="option-header">
                <h4 class="option-name">${feat.name}</h4>
                <div class="option-meta">
                    <span class="option-badge">Cost ${feat.cost}</span>
                </div>
            </div>
            <div class="option-attributes">Tiers: ${feat.tiers}</div>
            <div class="option-description">${feat.description || 'No description available'}</div>
            <div class="option-details" style="display: none;">
                ${feat.baseEffectDescription ? `
                <h6>Base Effect Description</h6>
                <div class="feat-html-content">${feat.baseEffectDescription}</div>
                ` : ''}
                ${feat.prerequisites && Object.keys(feat.prerequisites).length > 0 ? `
                <h6>Tier Requirements</h6>
                <div>${Object.entries(feat.prerequisites).map(([tier, prereq]) => {
                    let requirements = [];
                    let logicNotes = [];
                    
                    // Check if we have both attributes and feats with OR logic between them
                    const hasAttributes = prereq.attributes && prereq.attributes.length > 0;
                    const hasFeats = prereq.feats && prereq.feats.length > 0;
                    const hasFeatOrLogic = prereq.featRequirementLogic === "or";
                    
                    if (hasAttributes && hasFeats && hasFeatOrLogic) {
                        // Special case: Attributes OR Feats (like Craft Mundane Item)
                        const powerLevel = prereq.powerLevel || '?';
                        const attrReqs = prereq.attributes.map(attr => 
                            attr.charAt(0).toUpperCase() + attr.slice(1)
                        );
                        const attrString = `${attrReqs.join(' OR ')} [${powerLevel}]`;
                        const featString = prereq.feats.join(' OR ');
                        requirements.push(`${attrString} OR ${featString}`);
                        logicNotes.push(`<span class="requirement-logic or-logic">Attribute OR Feat required</span>`);
                    } else {
                        // Handle attribute requirements with logic indicators
                        if (hasAttributes) {
                            const powerLevel = prereq.powerLevel || '?';
                            const attrReqs = prereq.attributes.map(attr => 
                                attr.charAt(0).toUpperCase() + attr.slice(1)
                            );
                            
                            if (prereq.attributeRequirementLogic === "and") {
                                requirements.push(`${attrReqs.join(' AND ')} [${powerLevel}]`);
                                logicNotes.push(`<span class="requirement-logic and-logic">All attributes required</span>`);
                            } else {
                                requirements.push(`${attrReqs.join(' OR ')} [${powerLevel}]`);
                            }
                        }
                        
                        // Handle feat requirements with logic indicators
                        if (hasFeats) {
                            if (prereq.featRequirementLogic === "or") {
                                requirements.push(`<span class="requirement-logic or-logic">${prereq.feats.join(' OR ')}</span>`);
                                logicNotes.push(`<span class="requirement-logic or-logic">Any feat required</span>`);
                            } else {
                                requirements.push(prereq.feats.join(' AND '));
                            }
                        }
                    }
                    
                    const logicNote = logicNotes.length > 0 ? `<br><small>${logicNotes.join(' • ')}</small>` : '';
                    return `<p><strong>Tier ${tier}:</strong> ${requirements.length > 0 ? requirements.join(', ') : 'No requirements'}${logicNote}</p>`;
                }).join('')}</div>
                ` : ''}
                ${Object.keys(feat.effects || {}).length > 0 ? `
                <h6>Effects by Tier</h6>
                <div>${Object.entries(feat.effects).map(([tier, effect]) => 
                    `<p><strong>Tier ${tier}:</strong> ${effect}</p>`
                ).join('')}</div>
                ` : ''}
                ${feat.specialText ? `<h6>Special</h6><p>${feat.specialText}</p>` : ''}
            </div>
        `;
        
        return div;
    }

    // Create perk option element for Options List page
    createPerkOptionElementList(perk) {
        const div = document.createElement('div');
        div.className = 'option-item perk-item';
        div.onclick = () => this.toggleOptionDetailsList(div, 'perk');
        
        div.innerHTML = `
            <div class="option-header">
                <h4 class="option-name">${perk.name}</h4>
            </div>
            <div class="option-description">${perk.description || 'No description available'}</div>
            <div class="option-details" style="display: none;">
                <h6>Effect</h6>
                <p>${perk.effect || 'No effect specified'}</p>
            </div>
        `;
        
        return div;
    }

    // Create flaw option element for Options List page
    createFlawOptionElementList(flaw) {
        const div = document.createElement('div');
        div.className = 'option-item flaw-item';
        div.onclick = () => this.toggleOptionDetailsList(div, 'flaw');
        
        div.innerHTML = `
            <div class="option-header">
                <h4 class="option-name">${flaw.name}</h4>
            </div>
            <div class="option-description">${flaw.description || 'No description available'}</div>
            <div class="option-details" style="display: none;">
                <h6>Description</h6>
                <p>${flaw.description || 'No description available'}</p>
            </div>
        `;
        
        return div;
    }

    // Toggle option details for Options List page
    toggleOptionDetailsList(element, type) {
        const details = element.querySelector('.option-details');
        if (details.style.display === 'none') {
            details.style.display = 'block';
            element.classList.add('expanded');
        } else {
            details.style.display = 'none';
            element.classList.remove('expanded');
        }
    }

    // Update attribute max values based on level
    updateAttributeMaxValues() {
        if (!this.currentCharacter) return;
        
        const maxAttribute = this.getMaxAttributeValue();
        
        // Update all attribute max displays
        Object.keys(this.currentCharacter.attributes).forEach(attr => {
            const maxElement = document.getElementById(`${attr}Max`);
            if (maxElement) {
                maxElement.textContent = maxAttribute;
            }
            
            // Update all attribute inputs (for backward compatibility)
            const input = document.getElementById(attr);
            if (input) {
                input.max = maxAttribute;
            }
        });
    }

    // Calculate range for extraordinary attributes
    calculateAttributeRange(attributeScore) {
        if (attributeScore >= 7) {
            return "75ft.";
        } else if (attributeScore >= 4) {
            return "50ft.";
        } else if (attributeScore >= 1) {
            return "25ft.";
        } else {
            return "-"; // Show dash for 0 or negative scores
        }
    }

    // Update attribute displays (cost only)
    updateAttributeDisplays() {
        if (!this.currentCharacter) return;
        
        
        
        
        
        Object.keys(this.currentCharacter.attributes).forEach(attr => {
            const baseScore = this.currentCharacter.attributes[attr];
            const effectiveScore = this.getEffectiveAttributeScore(attr);
            const costElement = document.getElementById(`${attr}Cost`);
            const diceElement = document.getElementById(`${attr}Dice`);
            const scoreElement = document.getElementById(`${attr}Score`);
            const rangeElement = document.getElementById(`${attr}Range`);
            
            
            if (costElement) {
                // Always use base score for cost calculations
                costElement.textContent = this.calculateAttributeCost(baseScore);
            }
            
            if (diceElement) {
                // Use effective score for dice calculations (what the character can actually roll)
                diceElement.textContent = this.calculateAttributeDice(effectiveScore, attr);
            }
            
            // Also update the edit mode dice element
            const diceEditElement = document.getElementById(`${attr}DiceEdit`);
            if (diceEditElement) {
                diceEditElement.textContent = this.calculateAttributeDice(effectiveScore, attr);
            }
            
            if (scoreElement) {
                // Display effective score (what the character can actually use)
                scoreElement.textContent = effectiveScore;
                
                // Add visual indication if score is boosted by equipment
                if (effectiveScore > baseScore) {
                    scoreElement.classList.add('boosted-by-equipment');
                    scoreElement.title = `Base: ${baseScore}, Boosted by equipment to: ${effectiveScore}`;
                } else {
                    scoreElement.classList.remove('boosted-by-equipment');
                    scoreElement.title = `Base score: ${baseScore}`;
                }
            }
            
            // Update range for extraordinary attributes
            if (rangeElement) {
                const range = this.calculateAttributeRange(effectiveScore);
                rangeElement.textContent = range;
            }
            
            // Update Extraordinary Focus indicator
            this.updateExtraordinaryFocusIndicator(attr);
        });
        
        // Update total points spent
        this.updateTotalPointsSpent();
        
        // Update favorite actions (attribute scores and dice may have changed)
        this.populateFavoriteActions();
        
        // Update feat icons
        this.updateFeatIcons();
    }

    // Calculate attribute cost (cumulative)
    calculateAttributeCost(score) {
        if (score <= 0) return 0;
        // Cumulative cost: 1 costs 1, 2 costs 3, 3 costs 6, etc.
        return (score * (score + 1)) / 2;
    }

    // Calculate dice for attribute score
    calculateAttributeDice(score, attributeName = null) {
        if (score <= 0) return '-';
        
        // Check for Extraordinary Focus feat that affects this attribute
        let effectiveScore = score;
        let hasExtraordinaryFocus = false;
        let hasMartialFocus = false;
        
        if (attributeName && this.currentCharacter && this.currentCharacter.feats) {
            const extraordinaryFocusFeats = this.currentCharacter.feats.filter(feat => 
                feat.name === 'Extraordinary Focus' && feat.customDetails === attributeName
            );
            if (extraordinaryFocusFeats.length > 0) {
                effectiveScore = score + 1; // Increase dice by one level
                hasExtraordinaryFocus = true;
            }
            
            // Check for Martial Focus feat that affects this attribute (always applies to both Agility and Might)
            const martialFocusFeats = this.currentCharacter.feats.filter(feat => 
                feat.name === 'Martial Focus' && feat.customDetails &&
                (attributeName === 'agility' || attributeName === 'might')
            );
            if (martialFocusFeats.length > 0) {
                hasMartialFocus = true;
            }
        }
        
        const diceMap = {
            1: '1d4',
            2: '1d6',
            3: '1d8',
            4: '1d10',
            5: '2d6',
            6: '2d8',
            7: '2d10',
            8: '3d8',
            9: '3d10',
            10: '4d8'
        };
        
        // For scores above 10, stay at 4d8 (the maximum)
        const baseDice = score > 10 ? '4d8' : (diceMap[score] || '1d4');
        const martialFocusDice = (score + 1) > 10 ? '4d8' : (diceMap[score + 1] || '1d4');
        
        // For Martial Focus, show both base and enhanced dice
        if (hasMartialFocus && !hasExtraordinaryFocus) {
            return `${baseDice} / ${martialFocusDice}`;
        }
        
        return effectiveScore > 10 ? '4d8' : (diceMap[effectiveScore] || '1d4');
    }

    // Update feat icons on attributes
    updateFeatIcons() {
        if (!this.currentCharacter) return;
        
        // Update Persuasion feat icon for Brutal Intimidation
        const persuasionFeatIcon = document.getElementById('persuasionFeatIcon');
        if (persuasionFeatIcon) {
            if (this.hasFeat('Brutal Intimidation')) {
                persuasionFeatIcon.style.display = 'inline-block';
            } else {
                persuasionFeatIcon.style.display = 'none';
            }
        }
        
        // Update Energy Resistance icon for Defense Stats
        const energyResistanceIcon = document.getElementById('energyResistanceIcon');
        if (energyResistanceIcon) {
            if (this.hasFeat('Energy Resistance')) {
                energyResistanceIcon.style.display = 'inline-block';
            } else {
                energyResistanceIcon.style.display = 'none';
            }
        }
        
        // Update Martial Focus indicators for both Agility and Might
        this.updateExtraordinaryFocusIndicator('agility');
        this.updateExtraordinaryFocusIndicator('might');
    }

    // Update Extraordinary Focus indicator for attributes
    updateExtraordinaryFocusIndicator(attributeName) {
        if (!this.currentCharacter) return;
        
        // Check if this attribute has Extraordinary Focus
        const hasExtraordinaryFocus = this.currentCharacter.feats && 
            this.currentCharacter.feats.some(feat => 
                feat.name === 'Extraordinary Focus' && feat.customDetails === attributeName
            );
        
        // Check if this attribute has Martial Focus (always applies to both Agility and Might)
        const hasMartialFocus = this.currentCharacter.feats && 
            this.currentCharacter.feats.some(feat => 
                feat.name === 'Martial Focus' && feat.customDetails &&
                (attributeName === 'agility' || attributeName === 'might')
            );
        
        // Check if this attribute has Skill Specialization
        const hasSkillSpecialization = this.currentCharacter.feats && 
            this.currentCharacter.feats.some(feat => 
                feat.name === 'Skill Specialization' && feat.customDetails === attributeName
            );
        
        // Find the attribute name element by looking for the capitalized attribute name
        const capitalizedName = attributeName.charAt(0).toUpperCase() + attributeName.slice(1);
        const attributeNameElements = document.querySelectorAll('td.attribute-name');
        let attributeNameElement = null;
        
        for (const element of attributeNameElements) {
            // Check if the element contains the capitalized attribute name
            if (element.textContent.trim() === capitalizedName) {
                attributeNameElement = element;
                break;
            }
        }
        
        if (!attributeNameElement) return;
        
        // Remove existing indicators
        const existingExtraordinaryIndicator = attributeNameElement.querySelector('.extraordinary-focus-indicator');
        if (existingExtraordinaryIndicator) {
            existingExtraordinaryIndicator.remove();
        }
        const existingMartialIndicator = attributeNameElement.querySelector('.martial-focus-indicator');
        if (existingMartialIndicator) {
            existingMartialIndicator.remove();
        }
        const existingSkillSpecializationIndicator = attributeNameElement.querySelector('.skill-specialization-indicator');
        if (existingSkillSpecializationIndicator) {
            existingSkillSpecializationIndicator.remove();
        }
        
        // Add Extraordinary Focus indicator if applicable
        if (hasExtraordinaryFocus) {
            const indicator = document.createElement('div');
            indicator.className = 'extraordinary-focus-indicator';
            indicator.innerHTML = `
                <span class="feat-icon" title="Extraordinary Focus: Your focus heightens your power. For the purposes of determining your attribute dice for action rolls, you treat this attribute as if it was one greater." onclick="window.app.showFeatPopup('Extraordinary Focus', 'Your focus heightens your power. For the purposes of determining your attribute dice for action rolls, you treat this attribute as if it was one greater.')">🎯</span>
            `;
            attributeNameElement.appendChild(indicator);
        }
        
        // Add Martial Focus indicator if applicable
        if (hasMartialFocus) {
            const martialFeat = this.currentCharacter.feats.find(feat => 
                feat.name === 'Martial Focus' && feat.customDetails
            );
            const customDetails = martialFeat ? martialFeat.customDetails : 'Unknown details';
            
            const indicator = document.createElement('div');
            indicator.className = 'martial-focus-indicator';
            indicator.innerHTML = `
                <span class="feat-icon" title="Martial Focus: ${customDetails} - When making attacks using your chosen weapon, your ${capitalizedName} attribute is considered 1 greater for the purposes of determining attribute dice." onclick="window.app.showFeatPopup('Martial Focus', 'When making attacks using your chosen weapon, your attribute is considered 1 greater for the purposes of determining attribute dice. Your attribute is not changed for purposes of feats, banes, boons, or similar items.')">⚔️</span>
            `;
            attributeNameElement.appendChild(indicator);
        }
        
        // Add Skill Specialization indicator if applicable
        if (hasSkillSpecialization) {
            const skillSpecializationFeat = this.currentCharacter.feats.find(feat => 
                feat.name === 'Skill Specialization' && feat.customDetails === attributeName
            );
            const tier = skillSpecializationFeat ? skillSpecializationFeat.tier : 1;
            
            const indicator = document.createElement('div');
            indicator.className = 'skill-specialization-indicator';
            indicator.innerHTML = `
                <span class="feat-icon" title="Skill Specialization T${tier}: Any time you make a roll using ${capitalizedName} that is not for initiative, attacks, invocations, or the defend action, you gain advantage ${tier} on the roll." onclick="window.app.showFeatPopup('Skill Specialization', 'You have the eyes of an eagle, the endurance of an ox, the guile of a fox, or some similarly exceptional non-combat talent. Choose one attribute. Any time you make a roll using the chosen attribute that is not for initiative, attacks, invocations, or the defend action, you gain advantage 1 on the roll per tier of this feat you possess for that attribute.')">🎯</span>
            `;
            attributeNameElement.appendChild(indicator);
        }
    }

    // Validate attribute change and prevent if not enough points
    validateAttributeChange(input) {
        // Validation function called
        
        if (!this.currentCharacter) {
            console.error('No current character for validation');
            return;
        }
        
        const attributeName = input.id;
        const newValue = parseInt(input.value) || 0;
        const oldValue = this.currentCharacter.attributes[attributeName] || 0;
        
        // Validating attribute change
        
        // Skip validation if in manual mode
        if (this.currentCharacter.manualSettings) {
            // Update the attribute in the character object
            this.currentCharacter.attributes[attributeName] = newValue;
            
            // Update all displays and systems
            this.updateAttributeDisplays();
            this.populateAvailableBoonsAndBanes();
            this.updateDefenseStats();
            this.updateMaxHP();
            this.updateInitiative();
            this.updateMovementStats();
            this.updateAttributeSubstitutionDisplays();
            this.populateFeatsDropdown();
            
            // Auto-save
            this.autoSave();
            return;
        }
        
        // If decreasing, always allow (prevents users from getting stuck)
        if (newValue <= oldValue) {
            // Attribute decreased or unchanged, allowing
            
            // Update the attribute in the character object
            this.currentCharacter.attributes[attributeName] = newValue;
            
            // Update all displays and systems
            this.updateAttributeDisplays();
            this.populateAvailableBoonsAndBanes();
            this.updateDefenseStats();
            this.updateMaxHP();
            this.updateInitiative();
            this.updateMovementStats();
            this.updateAttributeSubstitutionDisplays();
            this.populateFeatsDropdown(); // Refresh available feats dropdown
            
            // Auto-save after successful update
            this.autoSave();
            // Decrease completed successfully
            return;
        }
        
        // Calculate cost difference
        const oldCost = this.calculateAttributeCost(oldValue);
        const newCost = this.calculateAttributeCost(newValue);
        const costDifference = newCost - oldCost;
        
        // Get available attribute points (respect alternate form limitations)
        const availableAttributePoints = this.getCurrentCharacterAvailableAttributePoints();
        const currentSpent = this.calculateTotalPointsSpent();
        const remainingPoints = availableAttributePoints - currentSpent;
        
        
        
        // Check if enough points available
        if (costDifference > remainingPoints) {
            // Insufficient points, blocking increase
            
            // Revert the display to old value
            const displayElement = document.getElementById(attributeName);
            if (displayElement) {
                displayElement.textContent = oldValue;
            }
            
            // Highlight the display as invalid
            this.highlightInvalidAttribute(displayElement);
            
            // Show error popup
            this.showAttributeErrorPopup(attributeName, costDifference, availableAttributePoints);
            
            // IMPORTANT: Don't update character object or displays
            // Character object NOT updated - validation blocked
            return;
        }
        
        // Validation passed, updating attribute
        
        // Update the attribute in the character object
        this.currentCharacter.attributes[attributeName] = newValue;
        
        // Update all displays and systems
        this.updateAttributeDisplays();
        this.populateAvailableBoonsAndBanes();
        this.updateDefenseStats();
        this.updateMaxHP();
        this.updateInitiative();
        this.updateMovementStats();
        this.updateAttributeSubstitutionDisplays();
        this.populateFeatsDropdown(); // Refresh available feats dropdown
        
        // Auto-save after successful validation
        this.autoSave();
        // All updates completed successfully
    }

    // Validate all attributes to ensure they don't exceed available points
    validateAllAttributes() {
        if (!this.currentCharacter) return;
        
        // Calculate available attribute points (respect alternate form limitations)
        const availableAttributePoints = this.getCurrentCharacterAvailableAttributePoints();
        const currentSpent = this.calculateTotalPointsSpent();
        
        if (currentSpent > availableAttributePoints) {
            console.warn(`Character has invalid attribute state: spent ${currentSpent}, available ${availableAttributePoints}`);
            // You could add logic here to reset attributes or show a warning
        }
    }

    // Get currently equipped armor
    getEquippedArmor() {
        if (!this.currentCharacter) return null;
        return this.currentCharacter.equipment.find(e => e.equipped && e.type === 'armor');
    }

    // Calculate total points spent (helper method)
    calculateTotalPointsSpent() {
        if (!this.currentCharacter) return 0;
        
        let totalSpent = 0;
        Object.values(this.currentCharacter.attributes).forEach(score => {
            totalSpent += this.calculateAttributeCost(score);
        });
        return totalSpent;
    }

    // Get maximum available attribute points (respect alternate form limitations)
    getMaxAvailableAttributePoints() {
        if (!this.currentCharacter) return 0;
        
        if (this.currentCharacter.isAlternateForm && this.currentCharacter.maxAttributePoints !== undefined) {
            // Alternate form: use the pre-calculated maximum
            return this.currentCharacter.maxAttributePoints;
        } else {
            // Primary form: normal calculation
            return 40 + (this.currentCharacter.experiencePoints * 3);
        }
    }

    // Get maximum available feat points (respect alternate form limitations)
    getMaxAvailableFeatPoints() {
        if (!this.currentCharacter) return 0;
        
        if (this.currentCharacter.isAlternateForm && this.currentCharacter.maxFeatPoints !== undefined) {
            // Alternate form: use the pre-calculated maximum
            return this.currentCharacter.maxFeatPoints;
        } else {
            // Primary form: normal calculation
            return 6 + this.currentCharacter.experiencePoints;
        }
    }

    // Highlight invalid attribute display
    highlightInvalidAttribute(element) {
        if (!element) return;
        
        element.style.color = '#ff6b6b';
        element.style.backgroundColor = '#fff5f5';
        element.style.borderRadius = '4px';
        element.style.padding = '2px 6px';
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
            element.style.color = '';
            element.style.backgroundColor = '';
            element.style.borderRadius = '';
            element.style.padding = '';
        }, 3000);
    }

    // Show attribute error popup
    showAttributeErrorPopup(attributeName, message, availableAttributePoints) {
        const popup = document.createElement('div');
        popup.className = 'attribute-error-popup';
        
        // Check if message is a number (old format) or string (new format)
        const isOldFormat = typeof message === 'number';
        
        if (isOldFormat) {
            // Old format: show points needed
            popup.innerHTML = `
                <div class="popup-content">
                    <h3>Not Enough Attribute Points</h3>
                    <p>You need <strong>${message}</strong> points to increase ${attributeName} to this level.</p>
                    <p>You only have <strong>${availableAttributePoints}</strong> attribute points available.</p>
                    <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">OK</button>
                </div>
            `;
        } else {
            // New format: show custom message
            popup.innerHTML = `
                <div class="popup-content">
                    <h3>Attribute Change Not Allowed</h3>
                    <p>${message}</p>
                    <p>You have <strong>${availableAttributePoints}</strong> total attribute points available.</p>
                    <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">OK</button>
                </div>
            `;
        }
        
        document.body.appendChild(popup);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 5000);
    }

    // Update total points spent and available points display
    updateTotalPointsSpent() {
        if (!this.currentCharacter) return;
        
        let totalSpent = 0;
        Object.values(this.currentCharacter.attributes).forEach(score => {
            totalSpent += this.calculateAttributeCost(score);
        });
        
        const availableAttributePoints = this.getCurrentCharacterAvailableAttributePoints();
        const remainingPoints = availableAttributePoints - totalSpent;
        
        document.getElementById('totalPointsSpent').textContent = totalSpent;
        document.getElementById('availableAttributePoints').textContent = availableAttributePoints;
        
        // Update the display to show remaining points
        const pointsDisplay = document.getElementById('totalPointsSpent').parentElement;
        if (pointsDisplay) {
            pointsDisplay.innerHTML = `<span>Total Attribute Points Spent: <span id="totalPointsSpent">${totalSpent}</span> / <span id="availableAttributePoints">${availableAttributePoints}</span> (Remaining: <span style="color: ${remainingPoints >= 0 ? '#51cf66' : '#ff6b6b'}">${remainingPoints}</span>)</span>`;
        }
    }

    // Update HP display
    updateHPDisplay() {
        if (!this.currentCharacter) return;
        
        // HP display elements removed - all info now in health bar text
        
        // Update health bar
        this.updateHealthBar();
    }

    // Update health bar visualization
    updateHealthBar() {
        if (!this.currentCharacter) return;
        
        const healthBarContainer = document.getElementById('healthBarContainer');
        if (!healthBarContainer) return;
        
        const baseMaxHP = this.currentCharacter.baseMaxHP;
        const currentMaxHP = this.currentCharacter.maxHP;
        const currentHP = this.currentCharacter.currentHP;
        
        // Calculate percentages
        const currentHPPercent = (currentHP / baseMaxHP) * 100;
        const reducedMaxPercent = ((baseMaxHP - currentMaxHP) / baseMaxHP) * 100;
        const missingHPPercent = 100-currentHPPercent-reducedMaxPercent;
        
        // Update health bar segments
        const currentHPSegment = document.getElementById('currentHPSegment');
        const missingHPSegment = document.getElementById('missingHPSegment');
        const reducedMaxSegment = document.getElementById('reducedMaxSegment');
        
        if (currentHPSegment) currentHPSegment.style.width = `${currentHPPercent}%`;
        if (missingHPSegment) missingHPSegment.style.width = `${missingHPPercent}%`;
        if (reducedMaxSegment) reducedMaxSegment.style.width = `${reducedMaxPercent}%`;
        
        // Update health bar text with comprehensive HP info
        const healthBarText = document.getElementById('healthBarText');
        if (healthBarText) {
            const lethalDamage = this.currentCharacter?.lethalDamage || 0;
            const baseMaxHP = this.currentCharacter?.baseMaxHP || 10;
            healthBarText.textContent = `HP: ${currentHP} - Max HP: ${baseMaxHP} - Lethal Damage: ${lethalDamage}`;
        }
    }

    // Calculate max HP based on new formula
    calculateMaxHP() {
        if (!this.currentCharacter) return 10;
        
        // Get effective attributes (considering Attribute Substitution)
        const fortitude = this.getEffectiveAttributeScore('fortitude');
        const presence = this.getEffectiveAttributeScore('presence');
        const will = this.getEffectiveAttributeScore('will');
        
        // Base HP = 10 + 2*(Fortitude + Presence + Will)
        let baseHP = 10 + (2 * (fortitude + presence + will));
        
        
        const toughAsNailsFeat = this.currentCharacter.feats && this.currentCharacter.feats.find(feat => feat.name === 'Tough as Nails');
        if (toughAsNailsFeat && toughAsNailsFeat.tier) {
            baseHP += toughAsNailsFeat.tier * 5; // +5 HP per tier
        }
        
        // Add custom health buff
        const customHealthBuff = this.currentCharacter.customHealthBuff || 0;
        baseHP += customHealthBuff;
        
        return baseHP;
    }

    // Calculate effective wealth score including feat bonuses
    calculateEffectiveWealthScore() {
        if (!this.currentCharacter) return 0;
        
        let effectiveWealth = this.currentCharacter.wealthScore || 0;
        
        
        const wealthyFeat = this.currentCharacter.feats && this.currentCharacter.feats.find(feat => feat.name === 'Wealthy');
        if (wealthyFeat && wealthyFeat.tier) {
            effectiveWealth += wealthyFeat.tier; // +1 wealth per tier
        }
        
        return effectiveWealth;
    }

    // Update wealth display
    updateWealthDisplay() {
        if (!this.currentCharacter) return;
        
        const effectiveWealth = this.calculateEffectiveWealthScore();
        const baseWealth = this.currentCharacter.wealthScore || 0;
        const wealthScoreInput = document.getElementById('viewWealthScore');
        const effectiveWealthDisplay = document.getElementById('viewEffectiveWealthDisplay');
        
        // Update wealth controls
        if (wealthScoreInput) {
            // Keep the input field showing the base wealth score (for editing)
            wealthScoreInput.value = baseWealth;
        }
        
        if (effectiveWealthDisplay) {
            
            if (effectiveWealth > baseWealth) {
                effectiveWealthDisplay.textContent = `Effective: ${effectiveWealth}`;
                effectiveWealthDisplay.style.display = 'inline';
            } else {
                effectiveWealthDisplay.style.display = 'none';
            }
        }
        
        // Update view mode wealth controls
        const viewWealthScoreInput = document.getElementById('viewWealthScore');
        const viewEffectiveWealthDisplay = document.getElementById('viewEffectiveWealthDisplay');
        const viewWealthUsedCheckbox = document.getElementById('viewWealthUsed');
        
        if (viewWealthScoreInput) {
            viewWealthScoreInput.value = baseWealth;
        }
        
        if (viewEffectiveWealthDisplay) {
            
            if (effectiveWealth > baseWealth) {
                viewEffectiveWealthDisplay.textContent = `Effective: ${effectiveWealth}`;
                viewEffectiveWealthDisplay.style.display = 'inline';
            } else {
                viewEffectiveWealthDisplay.style.display = 'none';
            }
        }
        
        if (viewWealthUsedCheckbox) {
            viewWealthUsedCheckbox.checked = this.currentCharacter.wealthUsed || false;
        }
        
        // Update any other wealth displays if they exist
        const wealthDisplays = document.querySelectorAll('.wealth-display');
        wealthDisplays.forEach(display => {
            display.textContent = effectiveWealth;
        });
    }

    // Update max HP
    updateMaxHP() {
        if (!this.currentCharacter) return;
        
        const oldMaxHP = this.currentCharacter.maxHP || 0;
        const newBaseMaxHP = this.calculateMaxHP();
        this.currentCharacter.baseMaxHP = newBaseMaxHP;
        
        // Apply lethal damage to get current max HP
        const newMaxHP = Math.max(1, newBaseMaxHP - this.currentCharacter.lethalDamage);
        this.currentCharacter.maxHP = newMaxHP;
        
        // If max HP decreased due to lethal damage, reduce current HP proportionally
        if (newMaxHP < oldMaxHP) {
            const hpReduction = oldMaxHP - newMaxHP;
            this.currentCharacter.currentHP = Math.max(1, this.currentCharacter.currentHP - hpReduction);
        }
        
        // Ensure current HP doesn't exceed new max HP
        this.currentCharacter.currentHP = Math.min(this.currentCharacter.currentHP, newMaxHP);
        
        this.updateHPDisplay();
    }

    // Update defense stats
    updateDefenseStats() {
        if (!this.currentCharacter) return;
        
        // Check if in manual mode
        if (this.currentCharacter.manualSettings && this.currentCharacter.manualOverrides) {
            // Use manual overrides
            const guard = this.currentCharacter.manualOverrides.guard || 10;
            const toughness = this.currentCharacter.manualOverrides.toughness || 10;
            const resolve = this.currentCharacter.manualOverrides.resolve || 10;
            
            // Just update the manual inputs if they're visible
            const guardInput = document.getElementById('guardValueManual');
            const toughnessInput = document.getElementById('toughnessValueManual');
            const resolveInput = document.getElementById('resolveValueManual');
            
            if (guardInput && guardInput.style.display !== 'none') {
                guardInput.value = guard;
            }
            if (toughnessInput && toughnessInput.style.display !== 'none') {
                toughnessInput.value = toughness;
            }
            if (resolveInput && resolveInput.style.display !== 'none') {
                resolveInput.value = resolve;
            }
            return;
        }
        
        // Get effective attributes (considering Attribute Substitution)
        const agility = this.getEffectiveAttributeScore('agility');
        const might = this.getEffectiveAttributeScore('might');
        const fortitude = this.getEffectiveAttributeScore('fortitude');
        const will = this.getEffectiveAttributeScore('will');
        const presence = this.getEffectiveAttributeScore('presence');
        
        // Get equipment bonuses
        const armorBonus = this.getEquipmentBonus('armor');
        const featBonus = this.getFeatBonus('guard');
        
        // Calculate defense values
        const guard = 10 + agility + might + armorBonus + featBonus + this.getBoonsBanesBonus('guard');
        const toughness = 10 + fortitude + will + this.getFeatBonus('toughness') + this.getBoonsBanesBonus('toughness');
        
        // Check for Stupefied bane - overrides Resolve to 10
        const stupefiedBane = this.currentCharacter.banes && this.currentCharacter.banes.find(bane => bane.name === 'Stupefied');
        let resolve;
        if (stupefiedBane) {
            resolve = 10; // Stupefied bane overrides Resolve to 10
        } else {
            resolve = 10 + presence + will + this.getFeatBonus('resolve') + this.getBoonsBanesBonus('resolve');
        }
        
        // Update displays
        const guardResistanceText = this.getResistanceText('guard', guard);
        document.getElementById('guardValue').innerHTML = guard + (guardResistanceText ? `<br><small style="color: white; font-size: var(--font-size-xs); font-weight: 300;">${guardResistanceText}</small>` : '');
        document.getElementById('guardAgility').textContent = agility;
        document.getElementById('guardMight').textContent = might;
        document.getElementById('guardArmor').textContent = armorBonus;
        document.getElementById('guardFeats').textContent = featBonus;
        document.getElementById('guardBoonsBanes').textContent = this.getBoonsBanesBonus('guard');
        
        const toughnessResistanceText = this.getResistanceText('toughness', toughness);
        document.getElementById('toughnessValue').innerHTML = toughness + (toughnessResistanceText ? `<br><small style="color: white; font-size: var(--font-size-xs); font-weight: 300;">${toughnessResistanceText}</small>` : '');
        document.getElementById('toughnessFortitude').textContent = fortitude;
        document.getElementById('toughnessWill').textContent = will;
        document.getElementById('toughnessFeats').textContent = this.getFeatBonus('toughness');
        document.getElementById('toughnessBoonsBanes').textContent = this.getBoonsBanesBonus('toughness');
        
        // Update resolve defense with potential feat indicator
        const resolveValueElement = document.getElementById('resolveValue');
        const resolveResistanceText = this.getResistanceText('resolve', resolve);
        if (resolveValueElement) {
            if (this.hasFeat('Impervious Trance')) {
                resolveValueElement.innerHTML = `${resolve} <span class="feat-indicator" title="Impervious Trance: While in battle trance, immune to banes that target Resolve" onclick="window.app.showFeatPopup('Impervious Trance', 'While in battle trance, immune to banes that target Resolve')">🛡️</span>` + (resolveResistanceText ? `<br><small style="color: white; font-size: var(--font-size-xs); font-weight: 300;">${resolveResistanceText}</small>` : '');
            } else {
                resolveValueElement.innerHTML = resolve + (resolveResistanceText ? `<br><small style="color: white; font-size: var(--font-size-xs); font-weight: 300;">${resolveResistanceText}</small>` : '');
            }
        }
        
        document.getElementById('resolvePresence').textContent = presence;
        document.getElementById('resolveWill').textContent = will;
        document.getElementById('resolveFeats').textContent = this.getFeatBonus('resolve');
        document.getElementById('resolveBoonsBanes').textContent = this.getBoonsBanesBonus('resolve');
    }

    // Get equipment bonus by type
    getEquipmentBonus(type) {
        if (!this.currentCharacter || !this.currentCharacter.equipment) return 0;
        
        let bonus = 0;
        this.currentCharacter.equipment.forEach(item => {
            if (item.equipped && item.type === type) {
                // Add armor defense to guard
                if (type === 'armor' && item.armorDefense) {
                    bonus += item.armorDefense;
                }
            }
        });
        return bonus;
    }

        // Get feat bonus by defense type
    getFeatBonus(defenseType) {
        if (!this.currentCharacter || !this.currentCharacter.feats) return 0;

        let bonus = 0;

        // Check for Extraordinary Defense feat bonus (affects all defense types)
        const extraordinaryDefenseFeat = this.currentCharacter.feats.find(feat => feat.name === 'Extraordinary Defense');
        if (extraordinaryDefenseFeat && extraordinaryDefenseFeat.tier) {
            bonus += extraordinaryDefenseFeat.tier; // +1 per tier to all defenses
            
        }

        // Check for Armor Mastery feat bonus (only when wearing armor)
        if (defenseType === 'guard') {
            const armorMasteryFeat = this.currentCharacter.feats.find(feat => feat.name === 'Armor Mastery');
            if (armorMasteryFeat && armorMasteryFeat.tier) {
                const equippedArmor = this.currentCharacter.equipment && this.currentCharacter.equipment.find(item => item.equipped && item.type === 'armor');
                if (equippedArmor) {
                    bonus += armorMasteryFeat.tier; // +1 for Tier 1, +2 for Tier 2
                    
                }
            }

            
            const naturalDefenseFeat = this.currentCharacter.feats.find(feat => feat.name === 'Natural Defense');
            if (naturalDefenseFeat && naturalDefenseFeat.tier) {
                bonus += 2; 
                
            }

            // Check for Two Weapon Defense feat bonus (only applies to Guard defense)
            if (defenseType === 'guard') {
                const twoWeaponDefenseFeat = this.currentCharacter.feats.find(feat => feat.name === 'Two Weapon Defense');
                if (twoWeaponDefenseFeat && twoWeaponDefenseFeat.tier) {
                    // Check if character is wielding weapons with Attack Specialization in both hands
                    const equippedWeapons = this.currentCharacter.equipment && this.currentCharacter.equipment.filter(item => item.equipped && item.type === 'weapon');
                    if (equippedWeapons.length >= 2) {
                        // Check if both weapons have Attack Specialization feats
                        const attackSpecializationFeats = this.currentCharacter.feats.filter(feat => feat.name === 'Attack Specialization');
                        let weaponsWithSpecialization = 0;
                        
                        equippedWeapons.forEach(weapon => {
                            // Check if there's an Attack Specialization feat for this specific weapon
                            const hasSpecialization = attackSpecializationFeats.some(feat => 
                                feat.customDetails && feat.customDetails.toLowerCase() === weapon.name.toLowerCase()
                            );
                            if (hasSpecialization) {
                                weaponsWithSpecialization++;
                            }
                        });
                        
                        
                        if (weaponsWithSpecialization >= 2) {
                            bonus += 1; // +1 armor bonus when wielding Attack Specialization weapons in both hands
                        }
                    }
                }
            }

            // Check for defensive weapon bonus (only when Defensive Mastery feat is present)
            bonus += this.getDefensiveWeaponBonus();
            if (this.getDefensiveWeaponBonus() > 0) {
                
            }
        }

        // Check for Indomitable Resolve feat bonus (only affects resolve defense)
        if (defenseType === 'resolve') {
            const indomitableResolveFeat = this.currentCharacter.feats.find(feat => feat.name === 'Indomitable Resolve');
            if (indomitableResolveFeat && indomitableResolveFeat.tier) {
                bonus += indomitableResolveFeat.tier; // +1 per tier to resolve defense
                
            }
        }

        // Check for Natural Defense feat bonus (only when not wearing armor)
        if (defenseType === 'guard' || defenseType === 'toughness') {
            const naturalDefenseFeat = this.currentCharacter.feats.find(feat => feat.name === 'Natural Defense');
            if (naturalDefenseFeat && naturalDefenseFeat.tier) {
                // Check if character is wearing armor
                const equippedArmor = this.currentCharacter.equipment && this.currentCharacter.equipment.find(item => item.equipped && item.type === 'armor');
                if (!equippedArmor) {
                    bonus += naturalDefenseFeat.tier; // +1 per tier to guard and toughness defenses
                    
                }
            }
        }

        return bonus;
    }

    // Check if character has a specific feat
    hasFeat(featName) {
        if (!this.currentCharacter || !this.currentCharacter.feats) return false;
        return this.currentCharacter.feats.some(feat => feat.name === featName);
    }

    // Show feat popup
    showFeatPopup(featName, shortDescription, detailedDescription = null) {
        // Remove any existing popup
        this.hideFeatPopup();
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'feat-popup-overlay';
        overlay.onclick = () => this.hideFeatPopup();
        
        // Create popup
        const popup = document.createElement('div');
        popup.className = 'feat-popup';
        
        // Get current tier for cumulative description
        const currentTier = this.getFeatTier(featName);
        const cumulativeDescription = this.getCumulativeFeatDescription(featName, currentTier, true);
        
        // Get detailed description from database if not provided
        if (!detailedDescription) {
            const databaseFeat = window.GAME_DATABASE?.feats?.find(f => f.name === featName);
            if (databaseFeat) {
                detailedDescription = databaseFeat.description || databaseFeat.baseEffectDescription || shortDescription;
            } else {
                detailedDescription = shortDescription;
            }
        }
        
        popup.innerHTML = `
            <div class="feat-popup-header">
                <h3 class="feat-popup-title">${featName}${currentTier > 0 ? ` (Tier ${currentTier})` : ''}</h3>
                <button class="feat-popup-close" onclick="window.app.hideFeatPopup()">&times;</button>
            </div>
            <div class="feat-popup-content">
                <p><strong>Effect:</strong> ${shortDescription}</p>
                ${cumulativeDescription ? 
                    `<h4>Cumulative Effects (Tier ${currentTier})</h4><div class="cumulative-effects">${cumulativeDescription}</div>` : ''}
                ${detailedDescription && detailedDescription !== shortDescription ? 
                    `<h4>Additional Information</h4><p>${detailedDescription}</p>` : ''}
            </div>
        `;
        
        // Add to page
        document.body.appendChild(overlay);
        document.body.appendChild(popup);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    // Hide feat popup
    hideFeatPopup() {
        const overlay = document.querySelector('.feat-popup-overlay');
        const popup = document.querySelector('.feat-popup');
        
        if (overlay) overlay.remove();
        if (popup) popup.remove();
        
        // Restore body scroll
        document.body.style.overflow = '';
    }

    // Generate cumulative feat description for display
    getCumulativeFeatDescription(featName, currentTier, includeBaseEffect = false) {
        const databaseFeat = window.GAME_DATABASE?.feats?.find(f => f.name === featName);
        if (!databaseFeat) return null;

        let cumulativeDescription = '';
        
        // Include base effect only if requested (for popups)
        if (includeBaseEffect && databaseFeat.baseEffectDescription) {
            cumulativeDescription += `<strong>Base Effect:</strong> ${databaseFeat.baseEffectDescription}`;
        }

        // Include all tiers up to current tier
        if (databaseFeat.effects) {
            for (let tier = 1; tier <= currentTier; tier++) {
                if (databaseFeat.effects[tier]) {
                    cumulativeDescription += `<div class="tier-effect"><strong>Tier ${tier} Effects:</strong> ${databaseFeat.effects[tier]}</div>`;
                }
            }
        }

        return cumulativeDescription;
    }

    // Get feat tier for a specific feat
    getFeatTier(featName) {
        if (!this.currentCharacter || !this.currentCharacter.feats) return 0;
        const feat = this.currentCharacter.feats.find(f => f.name === featName);
        return feat ? feat.tier : 0;
    }

    // Get effective defensive value of a weapon (including feat bonuses)
    getEffectiveDefensiveValue(weapon) {
        if (!weapon || !weapon.properties || !weapon.properties.includes('defensive')) {
            return 0;
        }
        
        let effectiveValue = weapon.defensiveValue || 1;
        
        // Add +1 if character has Defensive Mastery feat and weapon is equipped
        if (weapon.equipped && this.hasFeat('Defensive Mastery')) {
            effectiveValue += 1;
        }
        
        return effectiveValue;
    }

    // Get total defensive weapon bonus for the character
    getDefensiveWeaponBonus() {
        if (!this.currentCharacter || !this.currentCharacter.equipment || !this.hasFeat('Defensive Mastery')) {
            return 0;
        }
        
        const equippedDefensiveWeapon = this.currentCharacter.equipment.find(item => 
            item.equipped && item.type === 'weapon' && item.properties && item.properties.includes('defensive')
        );
        
        return equippedDefensiveWeapon ? 1 : 0; // +1 bonus when wielding defensive weapon with Defensive Mastery
    }

    // Get boons and banes bonus by defense type
    getBoonsBanesBonus(defenseType) {
        if (!this.currentCharacter) return 0;
        
        let bonus = 0;
        
        // Check active boons for defense bonuses
        if (this.currentCharacter.boons) {
            this.currentCharacter.boons.forEach(boon => {
                
                if (boon.name === 'Haste' && defenseType === 'guard') {
                    switch (boon.powerLevel) {
                        case 4:
                            bonus += 1;
                            break;
                        case 6:
                            bonus += 2;
                            break;
                        case 8:
                            bonus += 3;
                            break;
                    }
                }
                
                else if (boon.name === 'Concealment' && defenseType === 'guard' && boon.guardBonus) {
                    bonus += boon.guardBonus;
                }
                // Handle other boons with defense bonuses
                else if (boon.defenseBonus && boon.defenseType === defenseType) {
                    bonus += boon.defenseBonus;
                }
            });
        }
        
        // Check active banes for defense penalties
        if (this.currentCharacter.banes) {
            this.currentCharacter.banes.forEach(bane => {
                // Handle Blinded bane Guard penalty
                if (bane.name === 'Blinded' && defenseType === 'guard') {
                    bonus -= 3; // Blinded reduces Guard by 3
                }
                // Handle Sickened bane defense penalty
                else if (bane.name === 'Sickened') {
                    bonus -= 1; // Sickened reduces all defenses by 1
                }
                // Handle Fatigued bane defense penalties (level 4+)
                else if (bane.name === 'Fatigued' && bane.fatigueLevel >= 4) {
                    if (defenseType === 'guard') {
                        // Guard = Agility + Might
                        const agility = this.currentCharacter.attributes?.agility || 0;
                        const might = this.currentCharacter.attributes?.might || 0;
                        bonus -= (agility + might);
                    } else if (defenseType === 'toughness') {
                        // Toughness = Fortitude + Will
                        const fortitude = this.currentCharacter.attributes?.fortitude || 0;
                        const will = this.currentCharacter.attributes?.will || 0;
                        bonus -= (fortitude + will);
                    } else if (defenseType === 'resolve') {
                        // Resolve = Will + Presence
                        const will = this.currentCharacter.attributes?.will || 0;
                        const presence = this.currentCharacter.attributes?.presence || 0;
                        bonus -= (will + presence);
                    }
                }
                // Handle other banes with defense penalties
                else if (bane.defensePenalty && bane.defenseType === defenseType) {
                    bonus += bane.defensePenalty; // This will be negative
                }
            });
        }
        
        return bonus;
    }

    // Add Blinded bane effects
    addBlindedEffects(blindedBane) {
        if (!this.currentCharacter || blindedBane.name !== 'Blinded') return;
        
        // Add disadvantage for all attributes
        this.currentCharacter.disadvantages.push({
            name: 'Blinded',
            attribute: 'all attributes',
            count: 5,
            source: 'Blinded Bane'
        });
    }
    
    // Remove Blinded bane effects
    removeBlindedEffects() {
        if (!this.currentCharacter) return;
        
        // Remove all Blinded disadvantages
        this.currentCharacter.disadvantages = this.currentCharacter.disadvantages.filter(dis => 
            !(dis.name === 'Blinded' && dis.source === 'Blinded Bane')
        );
    }
    
    // Add Deafened bane effects
    addDeafenedEffects(deafenedBane) {
        if (!this.currentCharacter || deafenedBane.name !== 'Deafened') return;
        
        // Add disadvantage for Perception attribute
        this.currentCharacter.disadvantages.push({
            name: 'Deafened',
            attribute: 'Perception',
            count: 3,
            source: 'Deafened Bane'
        });
    }
    
    // Remove Deafened bane effects
    removeDeafenedEffects() {
        if (!this.currentCharacter) return;
        
        // Remove all Deafened disadvantages
        this.currentCharacter.disadvantages = this.currentCharacter.disadvantages.filter(dis => 
            !(dis.name === 'Deafened' && dis.source === 'Deafened Bane')
        );
    }
    
    // Add Demoralized bane effects
    addDemoralizedEffects(demoralizedBane) {
        if (!this.currentCharacter || demoralizedBane.name !== 'Demoralized') return;
        
        // Calculate disadvantage value based on power level
        let disadvantageValue = 0;
        switch (demoralizedBane.powerLevel) {
            case 3: disadvantageValue = 1; break;
            case 6: disadvantageValue = 2; break;
            case 8: disadvantageValue = 3; break;
            default: disadvantageValue = 0;
        }
        
        if (disadvantageValue > 0) {
            // Add disadvantage for all attributes
            this.currentCharacter.disadvantages.push({
                name: 'Demoralized',
                attribute: 'all attributes',
                count: disadvantageValue,
                source: 'Demoralized Bane'
            });
        }
    }
    
    // Remove Demoralized bane effects
    removeDemoralizedEffects() {
        if (!this.currentCharacter) return;
        
        // Remove all Demoralized disadvantages
        this.currentCharacter.disadvantages = this.currentCharacter.disadvantages.filter(dis => 
            !(dis.name === 'Demoralized' && dis.source === 'Demoralized Bane')
        );
    }
    
    // Add Fatigued bane effects
    addFatiguedEffects(fatiguedBane) {
        if (!this.currentCharacter || fatiguedBane.name !== 'Fatigued') return;
        
        // Set initial fatigue level if not set
        if (!fatiguedBane.fatigueLevel) {
            fatiguedBane.fatigueLevel = 1;
        }
        
        this.updateFatiguedEffects(fatiguedBane);
    }
    
    // Update Fatigued bane effects based on current level
    updateFatiguedEffects(fatiguedBane) {
        if (!this.currentCharacter || fatiguedBane.name !== 'Fatigued') return;
        
        // Remove all existing Fatigued effects first
        this.removeFatiguedEffects();
        
        const level = fatiguedBane.fatigueLevel || 1;
        
        // Level 1: Disadvantage 1 on non-attack actions
        if (level >= 1) {
            this.currentCharacter.disadvantages.push({
                name: 'Fatigued: 1 - Non-Attack Actions',
                attribute: 'all attributes',
                count: 1,
                source: 'Fatigued Bane'
            });
        }
        
        // Level 2: Add Slowed bane (non-removable)
        if (level >= 2) {
            // Check if Slowed bane already exists from Fatigued
            const existingSlowed = this.currentCharacter.banes.find(bane => 
                bane.name === 'Slowed' && bane.source === 'Fatigued Bane'
            );
            
            if (!existingSlowed) {
                this.currentCharacter.banes.push({
                    name: 'Slowed',
                    duration: 'special',
                    powerLevel: 1,
                    resists: [false, false, false],
                    removable: false,
                    source: 'Fatigued Bane'
                });
            }
        }
        
        // Level 3: Disadvantage 1 on attack rolls
        if (level >= 3) {
            this.currentCharacter.disadvantages.push({
                name: 'Fatigued: 3 - Attack Rolls',
                attribute: 'all attributes',
                count: 1,
                source: 'Fatigued Bane'
            });
        }
        
        // Level 4: Defense penalties (handled in getBoonsBanesBonus)
        // This is handled in the defense calculation functions
    }
    
    // Remove Fatigued bane effects
    removeFatiguedEffects() {
        if (!this.currentCharacter) return;
        
        // Remove all Fatigued disadvantages
        this.currentCharacter.disadvantages = this.currentCharacter.disadvantages.filter(dis => 
            !(dis.name.startsWith('Fatigued:') && dis.source === 'Fatigued Bane')
        );
        
        // Remove Slowed bane from Fatigued
        this.currentCharacter.banes = this.currentCharacter.banes.filter(bane => 
            !(bane.name === 'Slowed' && bane.source === 'Fatigued Bane')
        );
    }
    
    // Update fatigue level
    updateFatigueLevel(fatiguedBane, newLevel) {
        if (!this.currentCharacter || fatiguedBane.name !== 'Fatigued') return;
        
        fatiguedBane.fatigueLevel = Math.max(1, Math.min(6, parseInt(newLevel) || 1));
        this.updateFatiguedEffects(fatiguedBane);
        
        // Update UI
        this.updateDefenseStats();
        this.populateAdvantages();
        this.populateDisadvantages();
        this.populateBanes();
    }
    
    // Add Immobile bane effects
    addImmobileEffects(immobileBane) {
        if (!this.currentCharacter || immobileBane.name !== 'Immobile') return;
        
        // Immobile bane affects movement speed (handled in updateMovementStats)
        // No additional effects needed beyond movement override
    }
    
    // Remove Immobile bane effects
    removeImmobileEffects() {
        if (!this.currentCharacter) return;
        
        // Immobile bane only affects movement speed (handled in updateMovementStats)
        // No additional cleanup needed
    }
    
    // Add Incapacitated bane effects
    addIncapacitatedEffects(incapacitatedBane) {
        if (!this.currentCharacter || incapacitatedBane.name !== 'Incapacitated') return;
        
        // Add disadvantage for Perception attribute
        this.currentCharacter.disadvantages.push({
            name: 'Incapacitated',
            attribute: 'Perception',
            count: 5,
            source: 'Incapacitated Bane'
        });
        
        // Add Immobile bane (non-removable)
        const existingImmobile = this.currentCharacter.banes.find(bane => 
            bane.name === 'Immobile' && bane.source === 'Incapacitated Bane'
        );
        
        if (!existingImmobile) {
            this.currentCharacter.banes.push({
                name: 'Immobile',
                duration: 'special',
                powerLevel: 1,
                resists: [false, false, false],
                removable: false,
                source: 'Incapacitated Bane'
            });
        }
    }
    
    // Remove Incapacitated bane effects
    removeIncapacitatedEffects() {
        if (!this.currentCharacter) return;
        
        // Remove Incapacitated disadvantage
        this.currentCharacter.disadvantages = this.currentCharacter.disadvantages.filter(dis => 
            !(dis.name === 'Incapacitated' && dis.source === 'Incapacitated Bane')
        );
        
        // Remove Immobile bane from Incapacitated
        this.currentCharacter.banes = this.currentCharacter.banes.filter(bane => 
            !(bane.name === 'Immobile' && bane.source === 'Incapacitated Bane')
        );
    }
    
    // Add Knockdown bane effects
    addKnockdownEffects(knockdownBane) {
        if (!this.currentCharacter || knockdownBane.name !== 'Knockdown') return;
        
        // Add disadvantage for all attributes
        this.currentCharacter.disadvantages.push({
            name: 'Prone: Attack',
            attribute: 'all attributes',
            count: 1,
            source: 'Knockdown Bane'
        });
    }
    
    // Remove Knockdown bane effects
    removeKnockdownEffects() {
        if (!this.currentCharacter) return;
        
        // Remove Prone: Attack disadvantage
        this.currentCharacter.disadvantages = this.currentCharacter.disadvantages.filter(dis => 
            !(dis.name === 'Prone: Attack' && dis.source === 'Knockdown Bane')
        );
    }
    
    // Add Provoked bane effects
    addProvokedEffects(provokedBane) {
        if (!this.currentCharacter || provokedBane.name !== 'Provoked') return;
        
        // Calculate disadvantage value based on power level
        let disadvantageValue = 0;
        switch (provokedBane.powerLevel) {
            case 4: disadvantageValue = 1; break;
            case 5: disadvantageValue = 2; break;
            case 6: disadvantageValue = 3; break;
            case 7: disadvantageValue = 4; break;
            case 8: disadvantageValue = 5; break;
            case 9: disadvantageValue = 6; break;
            default: disadvantageValue = 0;
        }
        
        if (disadvantageValue > 0) {
            // Add disadvantage for all attributes
            this.currentCharacter.disadvantages.push({
                name: 'Provoked',
                attribute: 'all attributes',
                count: disadvantageValue,
                source: 'Provoked Bane'
            });
        }
    }
    
    // Remove Provoked bane effects
    removeProvokedEffects() {
        if (!this.currentCharacter) return;
        
        // Remove all Provoked disadvantages
        this.currentCharacter.disadvantages = this.currentCharacter.disadvantages.filter(dis => 
            !(dis.name === 'Provoked' && dis.source === 'Provoked Bane')
        );
    }
    
    // Add Sickened bane effects
    addSickenedEffects(sickenedBane) {
        if (!this.currentCharacter || sickenedBane.name !== 'Sickened') return;
        
        // Add disadvantage for all attributes
        this.currentCharacter.disadvantages.push({
            name: 'Sickened: Action Rolls',
            attribute: 'all attributes',
            count: 1,
            source: 'Sickened Bane'
        });
    }
    
    // Remove Sickened bane effects
    removeSickenedEffects() {
        if (!this.currentCharacter) return;
        
        // Remove Sickened: Action Rolls disadvantage
        this.currentCharacter.disadvantages = this.currentCharacter.disadvantages.filter(dis => 
            !(dis.name === 'Sickened: Action Rolls' && dis.source === 'Sickened Bane')
        );
    }
    
    // Add Stupefied bane effects
    addStupefiedEffects(stupefiedBane) {
        if (!this.currentCharacter || stupefiedBane.name !== 'Stupefied') return;
        
        // Stupefied bane affects Resolve defense (handled in updateDefenseStats)
        // No additional effects needed beyond Resolve override
    }
    
    // Remove Stupefied bane effects
    removeStupefiedEffects() {
        if (!this.currentCharacter) return;
        
        // Stupefied bane only affects Resolve defense (handled in updateDefenseStats)
        // No additional cleanup needed
    }

    // Get resistance text for defense displays
    getResistanceText(defenseType, baseValue) {
        if (!this.currentCharacter) return '';
        
        const resistanceTexts = [];
        
        // Check Resistance boons
        if (this.currentCharacter.boons) {
            const resistanceBoons = this.currentCharacter.boons.filter(boon => 
                boon.name === 'Resistance' && boon.resistanceType
            );
            
            resistanceBoons.forEach(boon => {
                let resistanceBonus = 0;
                if (boon.powerLevel >= 9) {
                    resistanceTexts.push(`immune to ${boon.resistanceType}`);
                } else {
                    switch (boon.powerLevel) {
                        case 3: resistanceBonus = 3; break;
                        case 5: resistanceBonus = 6; break;
                        case 7: resistanceBonus = 9; break;
                        default: resistanceBonus = 0;
                    }
                    const resistanceValue = baseValue + resistanceBonus;
                    resistanceTexts.push(`${resistanceValue} against ${boon.resistanceType}`);
                }
            });
        }
        
        // Check Energy Resistance feats
        if (this.currentCharacter.feats) {
            const energyResistanceFeats = this.currentCharacter.feats.filter(feat => 
                feat.name === 'Energy Resistance' && feat.customDetails
            );
            
            energyResistanceFeats.forEach(feat => {
                const tier = feat.tier || 1;
                const energyType = feat.customDetails;
                let resistanceBonus = 0;
                
                if (tier >= 4) {
                    resistanceTexts.push(`immune to ${energyType}`);
                } else {
                    switch (tier) {
                        case 1: resistanceBonus = 3; break;
                        case 2: resistanceBonus = 6; break;
                        case 3: resistanceBonus = 9; break;
                        default: resistanceBonus = 0;
                    }
                    const resistanceValue = baseValue + resistanceBonus;
                    resistanceTexts.push(`${resistanceValue} against ${energyType}`);
                }
            });
        }
        
        // Check Knockdown bane for Guard
        if (defenseType === 'guard' && this.currentCharacter.banes) {
            const knockdownBane = this.currentCharacter.banes.find(bane => bane.name === 'Knockdown');
            if (knockdownBane) {
                resistanceTexts.push('± 2 from prone');
            }
        }
        
        return resistanceTexts.join(', ');
    }

    // Test attack vs defense stat
    testAttack(defenseType) {
        if (!this.currentCharacter) return;
        
        const inputId = `${defenseType}AttackTest`;
        const attackRoll = parseInt(document.getElementById(inputId).value) || 0;
        
        if (attackRoll <= 0) {
            this.showNotification('Please enter a valid attack roll.', 'error');
            return;
        }
        
        let defenseValue = 0;
        switch (defenseType) {
            case 'guard':
                defenseValue = parseInt(document.getElementById('guardValue').textContent);
                break;
            case 'toughness':
                defenseValue = parseInt(document.getElementById('toughnessValue').textContent);
                break;
            case 'resolve':
                defenseValue = parseInt(document.getElementById('resolveValue').textContent);
                break;
        }
        
        if (attackRoll >= defenseValue) {
            // Hit! Calculate damage
            const damage = Math.max(3, attackRoll - defenseValue);
            this.currentCharacter.currentHP = Math.max(0, this.currentCharacter.currentHP - damage);
            this.updateHPDisplay();
            this.autoSave();
            
            // Show regular hit notification
            this.showNotification(`Hit! ${defenseType} ${defenseValue} vs ${attackRoll}. Damage: ${damage}`, 'success');
            
            // Check if damage is 10 or more for special popup
            if (damage >= 10) {
                setTimeout(() => {
                    this.showHighDamagePopup(defenseType, damage);
                }, 500); // Small delay to show after the regular notification
            }
        } else {
            // Miss
            this.showNotification(`Miss! ${defenseType} ${defenseValue} vs ${attackRoll}`, 'info');
        }
        
        // Clear input
        document.getElementById(inputId).value = '';
    }

    // Show special popup for high damage (10+)
    showHighDamagePopup(defenseType, damage) {
        const defenseName = defenseType.charAt(0).toUpperCase() + defenseType.slice(1);
        const message = `⚡ High Damage Alert! ⚡\n\n${defenseName} took ${damage} damage!\n\nThis damage (10+) means:\n• A bane is applicable\n• A sustained boon may be canceled\n\nRemember to check your boons and banes!`;
        
        // Create a special high-damage notification
        this.showNotification(message, 'warning');
        
        // Also show a more prominent popup for high damage
        this.showHighDamageModal(defenseType, damage);
    }

    // Show prominent modal for high damage
    showHighDamageModal(defenseType, damage) {
        const defenseName = defenseType.charAt(0).toUpperCase() + defenseType.slice(1);
        
        // Create modal HTML
        const modalHTML = `
            <div id="highDamageModal" class="modal high-damage-modal" style="display: block;">
                <div class="modal-content high-damage-content">
                    <div class="high-damage-header">
                        <span class="close" onclick="this.parentElement.parentElement.parentElement.style.display='none'">&times;</span>
                        <h2>⚡ High Damage Alert! ⚡</h2>
                    </div>
                    <div class="high-damage-body">
                        <div class="damage-display">
                            <span class="damage-number">${damage}</span>
                            <span class="damage-label">Damage to ${defenseName}</span>
                        </div>
                        <div class="game-mechanics-info">
                            <h3>Game Mechanics Reminder:</h3>
                            <div class="mechanics-grid">
                                <div class="mechanic-item">
                                    <i class="fas fa-skull"></i>
                                    <h4>Bane Applicable</h4>
                                    <p>You can apply a bane to the target due to this high damage.</p>
                                </div>
                                <div class="mechanic-item">
                                    <i class="fas fa-star"></i>
                                    <h4>Sustained Boon Cancel</h4>
                                    <p>A sustained boon on the target may be canceled.</p>
                                </div>
                            </div>
                        </div>
                        <div class="action-buttons">
                            <button class="btn btn-primary" onclick="this.parentElement.parentElement.parentElement.style.display='none'">
                                <i class="fas fa-check"></i> Got it!
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Auto-close after 8 seconds
        setTimeout(() => {
            const modal = document.getElementById('highDamageModal');
            if (modal) {
                modal.style.display = 'none';
                modal.remove();
            }
        }, 8000);
    }

    // Apply damage
    applyDamage() {
        if (!this.currentCharacter) return;
        
        const damageInput = document.getElementById('damageInput');
        const damage = parseInt(damageInput.value) || 0;
        
        if (damage === 0) {
            this.showNotification('Please enter a damage amount.', 'error');
            return;
        }
        
        // Apply damage (reduce current HP and track total damage)
        this.currentCharacter.currentHP = Math.max(0, this.currentCharacter.currentHP - damage);
        this.currentCharacter.totalDamageTaken += damage;
        this.updateHPDisplay();
        
        // Sync damage to related characters
        this.syncDamageToRelatedCharacters();
        
        this.autoSave();
        
        this.showNotification(`Applied ${damage} damage!`, 'success');
        damageInput.value = '';
    }

    // Apply healing
    applyHealing() {
        if (!this.currentCharacter) return;
        
        const damageInput = document.getElementById('damageInput');
        const healing = parseInt(damageInput.value) || 0;
        
        if (healing === 0) {
            this.showNotification('Please enter a healing amount.', 'error');
            return;
        }
        
        // Apply healing (increase current HP up to max and reduce total damage)
        const actualHealing = Math.min(healing, this.currentCharacter.totalDamageTaken);
        this.currentCharacter.currentHP = Math.min(this.currentCharacter.maxHP, this.currentCharacter.currentHP + healing);
        this.currentCharacter.totalDamageTaken = Math.max(0, this.currentCharacter.totalDamageTaken - actualHealing);
        this.updateHPDisplay();
        
        // Sync damage to related characters
        this.syncDamageToRelatedCharacters();
        
        this.autoSave();
        
        this.showNotification(`Healed ${healing} HP!`, 'success');
        damageInput.value = '';
    }

    // Apply lethal damage
    applyLethalDamage() {
        if (!this.currentCharacter) return;
        
        const lethalDamageInput = document.getElementById('lethalDamageInput');
        const lethalDamage = parseInt(lethalDamageInput.value) || 0;
        
        if (lethalDamage === 0) {
            this.showNotification('Please enter a lethal damage amount.', 'error');
            return;
        }
        
        // Apply lethal damage (reduce max HP)
        this.currentCharacter.lethalDamage = Math.max(0, this.currentCharacter.lethalDamage + lethalDamage);
        
        // Update max HP to reflect lethal damage
        this.updateMaxHP();
        
        // Sync damage to related characters
        this.syncDamageToRelatedCharacters();
        
        this.autoSave();
        
        this.showNotification(`Applied ${lethalDamage} lethal damage!`, 'success');
        lethalDamageInput.value = '';
    }

    // Apply lethal healing
    applyLethalHealing() {
        if (!this.currentCharacter) return;
        
        const lethalDamageInput = document.getElementById('lethalDamageInput');
        const healing = parseInt(lethalDamageInput.value) || 0;
        
        if (healing === 0) {
            this.showNotification('Please enter a lethal healing amount.', 'error');
            return;
        }
        
        const oldMaxHP = this.currentCharacter.maxHP || 0;
        
        // Apply lethal healing (restore max HP up to base max)
        this.currentCharacter.lethalDamage = Math.max(0, this.currentCharacter.lethalDamage - healing);
        
        // Update max HP to reflect healing
        this.updateMaxHP();
        
        // If max HP increased due to lethal healing, increase current HP proportionally
        const newMaxHP = this.currentCharacter.maxHP;
        if (newMaxHP > oldMaxHP) {
            const hpIncrease = newMaxHP - oldMaxHP;
            this.currentCharacter.currentHP = Math.min(newMaxHP, this.currentCharacter.currentHP + hpIncrease);
            this.updateHPDisplay();
        }
        
        // Sync damage to related characters
        this.syncDamageToRelatedCharacters();
        
        this.autoSave();
        
        this.showNotification(`Healed ${healing} lethal damage!`, 'success');
        lethalDamageInput.value = '';
    }



    // Reset HP to max
    resetHP() {
        if (!this.currentCharacter) return;
        
        // Confirm before resetting
        const confirmed = confirm('Are you sure you want to reset HP to maximum? This will clear all damage taken.');
        if (!confirmed) return;
        
        this.currentCharacter.currentHP = this.currentCharacter.maxHP;
        this.currentCharacter.totalDamageTaken = 0;
        this.updateHPDisplay();
        
        // Sync damage to related characters
        this.syncDamageToRelatedCharacters();
        
        this.autoSave();
        
        this.showNotification('HP reset to maximum!', 'success');
    }

    // Reset lethal damage
    resetLethalDamage() {
        if (!this.currentCharacter) return;
        
        // Confirm before resetting
        const confirmed = confirm('Are you sure you want to reset lethal damage to 0? This will restore maximum HP.');
        if (!confirmed) return;
        
        this.currentCharacter.lethalDamage = 0;
        this.updateMaxHP();
        this.autoSave();
        
        this.showNotification('Lethal damage reset!', 'success');
    }

    // Find an identical unequipped item for stacking
    findIdenticalUnequippedItem(newItem) {
        if (!this.currentCharacter || !this.currentCharacter.equipment) return null;
        
        // Don't stack equipped items
        if (newItem.equipped) return null;
        
        return this.currentCharacter.equipment.find(item => {
            // Must be unequipped
            if (item.equipped) return false;
            
            // Must have same name and type
            if (item.name !== newItem.name || item.type !== newItem.type) return false;
            
            // Must have same effects
            if (item.effects !== newItem.effects) return false;
            
            // For weapons, check all weapon properties
            if (item.type === 'weapon') {
                if (item.weaponCategory !== newItem.weaponCategory) return false;
                if (item.rangeIncrement !== newItem.rangeIncrement) return false;
                if (item.wealthLevel !== newItem.wealthLevel) return false;
                
                // Check properties arrays
                const props1 = JSON.stringify(item.properties || []);
                const props2 = JSON.stringify(newItem.properties || []);
                if (props1 !== props2) return false;
                
                // Check banes arrays
                const banes1 = JSON.stringify(item.banes || []);
                const banes2 = JSON.stringify(newItem.banes || []);
                if (banes1 !== banes2) return false;
                
                // Check universal properties
                const uProps1 = JSON.stringify(item.universalProperties || []);
                const uProps2 = JSON.stringify(newItem.universalProperties || []);
                if (uProps1 !== uProps2) return false;
            }
            
            // For armor, check armor properties
            if (item.type === 'armor') {
                if (item.armorDefense !== newItem.armorDefense) return false;
                if (item.requiredFortitude !== newItem.requiredFortitude) return false;
                if (item.wealthLevel !== newItem.wealthLevel) return false;
                if (item.speedReduction !== newItem.speedReduction) return false;
                
                // Check universal properties
                const uProps1 = JSON.stringify(item.universalProperties || []);
                const uProps2 = JSON.stringify(newItem.universalProperties || []);
                if (uProps1 !== uProps2) return false;
            }
            
            // For items, check item properties
            if (item.type === 'item') {
                if (item.itemAttributeScore !== newItem.itemAttributeScore) return false;
                if (item.itemPowerLevel !== newItem.itemPowerLevel) return false;
                if (item.wealthLevel !== newItem.wealthLevel) return false;
                
                // Check universal properties
                const uProps1 = JSON.stringify(item.universalProperties || []);
                const uProps2 = JSON.stringify(newItem.universalProperties || []);
                if (uProps1 !== uProps2) return false;
            }
            
            return true;
        });
    }

    // Add equipment
    addEquipment() {
        if (!this.currentCharacter) return;
        
        const name = document.getElementById('equipmentName').value.trim();
        const type = document.getElementById('equipmentType').value;
        const effects = document.getElementById('equipmentEffects').value.trim();
        const quantity = parseInt(document.getElementById('equipmentQuantity').value) || 1;
        
        if (!name) {
            this.showNotification('Please enter equipment name.', 'error');
            return;
        }
        
        const equipment = {
            id: this.generateUniqueEquipmentId(),
            name: name,
            type: type,
            effects: effects,
            equipped: false,
            quantity: quantity
        };
        
        // Add weapon-specific fields
        if (type === 'weapon') {
            // Weapon category
            equipment.weaponCategory = document.getElementById('weaponCategory').value;
            
            // Range increment
            equipment.rangeIncrement = document.getElementById('weaponRangeIncrement').value;
            
            // Wealth level
            equipment.wealthLevel = parseInt(document.getElementById('weaponWealthLevel').value) || 0;
            
            // Add universal properties
            this.addUniversalProperties(equipment, 'weapon');
            
            // Weapon-specific properties
            equipment.properties = [];
            if (document.getElementById('weaponDefensive').checked) {
                equipment.properties.push('defensive');
                equipment.defensiveValue = parseInt(document.getElementById('weaponDefensiveValue').value) || 1;
            }
            if (document.getElementById('weaponDeadly').checked) {
                equipment.properties.push('deadly');
                equipment.deadlyValue = parseInt(document.getElementById('weaponDeadlyValue').value) || 1;
            }
            if (document.getElementById('weaponDamageType').checked) {
                equipment.properties.push('damageType');
                equipment.damageType = document.getElementById('weaponDamageTypeSelect').value;
            }
            if (document.getElementById('weaponBaneful').checked) {
                equipment.properties.push('baneful');
                equipment.banefulBane = document.getElementById('weaponBanefulSelect').value;
            }
            if (document.getElementById('weaponDelayedReady').checked) equipment.properties.push('delayedReady');
            if (document.getElementById('weaponForceful').checked) equipment.properties.push('forceful');
            if (document.getElementById('weaponHeavy').checked) equipment.properties.push('heavy');
            if (document.getElementById('weaponPrecise').checked) equipment.properties.push('precise');
            if (document.getElementById('weaponReach').checked) equipment.properties.push('reach');
            if (document.getElementById('weaponSlow').checked) equipment.properties.push('slow');
            if (document.getElementById('weaponStationary').checked) equipment.properties.push('stationary');
            if (document.getElementById('weaponSwift').checked) equipment.properties.push('swift');
            
            // Weapon banes
            equipment.banes = [];
            const bane1 = document.getElementById('weaponBane1').value;
            const bane2 = document.getElementById('weaponBane2').value;
            const bane3 = document.getElementById('weaponBane3').value;
            if (bane1) equipment.banes.push(bane1);
            if (bane2) equipment.banes.push(bane2);
            if (bane3) equipment.banes.push(bane3);
            
            // Equipment created (debug logging removed)
            
            // Clear weapon fields
            this.clearWeaponFields();
        }
        
        // Add armor-specific fields
        if (type === 'armor') {
            equipment.armorDefense = parseInt(document.getElementById('armorDefense').value) || 0;
            equipment.requiredFortitude = parseInt(document.getElementById('requiredFortitude').value) || 0;
            equipment.wealthLevel = parseInt(document.getElementById('armorWealthLevel').value) || 0;
            equipment.speedReduction = document.getElementById('armorSpeedReduction').checked;
            
            // Add universal properties
            this.addUniversalProperties(equipment, 'armor');
            
            // Equipment created (debug logging removed)
            
            // Clear armor fields
            document.getElementById('armorDefense').value = '';
            document.getElementById('requiredFortitude').value = '';
            document.getElementById('armorWealthLevel').value = '0';
            document.getElementById('armorSpeedReduction').checked = false;
        }
        
        // Add item-specific fields
        if (type === 'item') {
            equipment.itemAttributeScore = document.getElementById('itemAttributeScore').value;
            equipment.itemPowerLevel = parseInt(document.getElementById('itemPowerLevel').value) || 0;
            equipment.wealthLevel = parseInt(document.getElementById('itemWealthLevel').value) || 0;
            
            // Add universal properties
            this.addUniversalProperties(equipment, 'item');
            
            // Equipment created (debug logging removed)
            
            // Clear item fields
            this.clearItemFields();
        }
        
        // Check if an identical unequipped item already exists and stack them
        const existingItem = this.findIdenticalUnequippedItem(equipment);
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + quantity;
            this.showNotification(`Stacked ${quantity} ${name}(s). Total: ${existingItem.quantity}`, 'success');
        } else {
            this.currentCharacter.equipment.push(equipment);
            this.showNotification(`Added equipment: ${name} x${quantity}`, 'success');
        }
        
        this.populateEquipment();
        this.updateWeaponAdvantageDisplay(); // Update weapon advantage display
        
        // Sync equipment to related characters
        this.syncEquipmentToRelatedCharacters();
        
        this.autoSave();
        
        // Clear inputs
        document.getElementById('equipmentName').value = '';
        document.getElementById('equipmentEffects').value = '';
        document.getElementById('equipmentQuantity').value = '1';
    }

    // Populate equipment list
    populateEquipment() {
        if (!this.currentCharacter) return;
        
        const equipmentList = document.getElementById('equipmentList');
        equipmentList.innerHTML = '';
        
        // Sort equipment alphabetically by name
        const sortedEquipment = this.sortItemsAlphabetically(this.currentCharacter.equipment);
        
        sortedEquipment.forEach(item => {
            
            if (item.universalProperties && item.universalProperties.includes('cursed') && item.equipped) {
                const existingBane = this.currentCharacter.banes?.find(b => b.equipmentId === item.id && b.isCursed);
                if (!existingBane) {
                    this.addCursedBane(item);
                }
            }
            
            
            if (item.universalProperties && item.universalProperties.includes('persistent') && item.equipped) {
                const existingAvailableBoon = this.currentCharacter.availableBoons?.find(b => b.equipmentId === item.id && b.isPersistent);
                const existingActiveBoon = this.currentCharacter.boons?.find(b => b.equipmentId === item.id && b.isPersistent);
                
                if (!existingAvailableBoon || !existingActiveBoon) {
                    this.addPersistentBoon(item);
                }
            }
            
            // If this is a reliable item that's equipped, ensure the boon is applied to available boons
            if (item.universalProperties && item.universalProperties.includes('reliable') && item.equipped) {
                const existingAvailableBoon = this.currentCharacter.availableBoons?.find(b => b.equipmentId === item.id && b.isReliable);
                
                if (!existingAvailableBoon) {
                    this.addReliableBoon(item);
                }
            }
            
            const itemElement = document.createElement('div');
            itemElement.className = `equipment-item ${item.equipped ? 'equipped' : ''}`;
            
            const quantity = item.quantity || 1;
            const quantityDisplay = quantity > 1 ? ` x${quantity}` : '';
            
            itemElement.innerHTML = `
                <div class="equipment-info">
                    <div class="equipment-name">${item.name}${quantityDisplay}</div>
                    <div class="equipment-type">${item.type}</div>
                    <div class="equipment-details" style="display: ${document.body.classList.contains('view-mode') ? 'block' : 'none'};">
                        <!-- Compact view mode display -->
                        <div class="equipment-details-compact">
                            ${('wealthLevel' in item) ? `<span class="detail-tag">WL: ${item.wealthLevel}</span>` : ''}
                            ${item.effects && item.effects.trim() ? `<span class="detail-tag">Description: ${item.effects.trim()}</span>` : ''}
                            ${('armorDefense' in item) ? `<span class="detail-tag">Armor Defense: ${item.armorDefense}</span>` : ''}
                            ${('requiredFortitude' in item) ? `<span class="detail-tag">Required Fortitude: ${item.requiredFortitude}</span>` : ''}
                            ${('speedReduction' in item) ? `<span class="detail-tag">Speed Reduction: ${item.speedReduction ? 'Yes' : 'No'}</span>` : ''}
                            ${item.weaponCategory ? `<span class="detail-tag clickable-property" onclick="window.app.showPropertyPopup('${this.formatWeaponCategory(item.weaponCategory)}', 'weapon')" title="Click for description">${this.formatWeaponCategory(item.weaponCategory)}</span>` : ''}
                            ${item.rangeIncrement ? `<span class="detail-tag clickable-property" onclick="window.app.showPropertyPopup('${item.rangeIncrement} Ranged', 'weapon')" title="Click for description">Range: ${item.rangeIncrement}</span>` : ''}
                            ${item.properties && item.properties.length > 0 ? item.properties.map(prop => {
                                let propDisplay = this.formatWeaponProperty(prop, item);
                                // Show increased defensive value for equipped defensive weapons with Defensive Mastery feat
                                if (prop === 'defensive' && item.equipped && item.defensiveValue && this.hasFeat('Defensive Mastery')) {
                                    // Replace the base defensive value with the increased one
                                    const baseValue = item.defensiveValue;
                                    const effectiveValue = this.getEffectiveDefensiveValue(item);
                                    propDisplay = propDisplay.replace(`(${baseValue})`, `(${baseValue})+1`);
                                }
                                return `<span class="detail-tag">${propDisplay}</span>`;
                            }).join('') : ''}
                            ${item.banes && item.banes.length > 0 ? item.banes.map(bane => `<span class="detail-tag">${bane}</span>`).join('') : ''}
                            ${item.itemAttributeScore && item.itemAttributeScore !== 'none' ? `<span class="detail-tag">Attribute: ${item.itemAttributeScore}</span>` : ''}
                            ${item.itemPowerLevel ? `<span class="detail-tag">Power Level: ${item.itemPowerLevel}</span>` : ''}
                            ${item.universalProperties && item.universalProperties.length > 0 ? item.universalProperties.map(prop => `<span class="detail-tag">${this.formatUniversalProperty(prop, item)}</span>`).join('') : ''}
                        </div>
                        
                        <!-- Full edit mode display -->
                        <div class="equipment-details-full">
                            <!-- Basic Information -->
                            <div class="equipment-basic-info">
                                <div class="equipment-name-edit">
                                    <label>Name:</label>
                                    <input type="text" class="equipment-name-input" data-equipment-id="${item.id}" data-field="name" value="${item.name || ''}" placeholder="Equipment name">
                                </div>
                                <div class="equipment-quantity-edit">
                                    <label>Quantity:</label>
                                    <input type="number" class="equipment-quantity-input" data-equipment-id="${item.id}" data-field="quantity" value="${item.quantity || 1}" min="1" style="width: 80px;" ${item.equipped ? 'disabled title="Unequip to change quantity"' : ''}>
                                </div>
                                <div class="equipment-type-edit">
                                    <label>Type:</label>
                                    <select class="equipment-type-select" data-equipment-id="${item.id}" data-field="type">
                                        <option value="weapon" ${item.type === 'weapon' ? 'selected' : ''}>Weapon</option>
                                        <option value="armor" ${item.type === 'armor' ? 'selected' : ''}>Armor</option>
                                        <option value="item" ${item.type === 'item' ? 'selected' : ''}>Item</option>
                                    </select>
                                </div>
                                <div class="equipment-wealth-level">
                                    <label>Wealth Level (0-10):</label>
                                    <input type="number" class="equipment-wealth-input" data-equipment-id="${item.id}" data-field="wealthLevel" value="${item.wealthLevel || 0}" min="0" max="10">
                                </div>
                            </div>

                            <!-- Description -->
                            <div class="equipment-effects">
                                <label>Description:</label>
                                <textarea class="equipment-effects-edit" data-equipment-id="${item.id}" data-field="effects">${item.effects || ''}</textarea>
                            </div>

                            <!-- Weapon-specific properties -->
                            ${item.type === 'weapon' ? `
                                <div class="weapon-properties-section">
                                    <h4>Weapon Properties</h4>
                                    <div class="weapon-properties-grid">
                                        <div class="weapon-property">
                                            <label><input type="checkbox" class="weapon-property-checkbox" data-equipment-id="${item.id}" data-property="heavy" ${item.properties && item.properties.includes('heavy') ? 'checked' : ''}> Heavy</label>
                                        </div>
                                        <div class="weapon-property">
                                            <label><input type="checkbox" class="weapon-property-checkbox" data-equipment-id="${item.id}" data-property="precise" ${item.properties && item.properties.includes('precise') ? 'checked' : ''}> Precise</label>
                                        </div>
                                        <div class="weapon-property">
                                            <label><input type="checkbox" class="weapon-property-checkbox" data-equipment-id="${item.id}" data-property="swift" ${item.properties && item.properties.includes('swift') ? 'checked' : ''}> Swift</label>
                                        </div>
                                        <div class="weapon-property">
                                            <label><input type="checkbox" class="weapon-property-checkbox" data-equipment-id="${item.id}" data-property="slow" ${item.properties && item.properties.includes('slow') ? 'checked' : ''}> Slow</label>
                                        </div>
                                        <div class="weapon-property">
                                            <label><input type="checkbox" class="weapon-property-checkbox" data-equipment-id="${item.id}" data-property="defensive" ${item.properties && item.properties.includes('defensive') ? 'checked' : ''}> Defensive</label>
                                            ${item.properties && item.properties.includes('defensive') ? `<input type="number" class="weapon-property-input" data-equipment-id="${item.id}" data-property="defensive" data-field="defensiveValue" value="${item.defensiveValue || 1}" min="1" max="3">` : ''}
                                        </div>
                                        <div class="weapon-property">
                                            <label><input type="checkbox" class="weapon-property-checkbox" data-equipment-id="${item.id}" data-property="deadly" ${item.properties && item.properties.includes('deadly') ? 'checked' : ''}> Deadly</label>
                                            ${item.properties && item.properties.includes('deadly') ? `<input type="number" class="weapon-property-input" data-equipment-id="${item.id}" data-property="deadly" data-field="deadlyValue" value="${item.deadlyValue || 1}" min="1" max="3">` : ''}
                                        </div>
                                        <div class="weapon-property">
                                            <label><input type="checkbox" class="weapon-property-checkbox" data-equipment-id="${item.id}" data-property="damageType" ${item.properties && item.properties.includes('damageType') ? 'checked' : ''}> Damage Type</label>
                                            ${item.properties && item.properties.includes('damageType') ? `<select class="weapon-property-input" data-equipment-id="${item.id}" data-property="damageType" data-field="damageType">
                                                <option value="precise" ${item.damageType === 'precise' ? 'selected' : ''}>Precise</option>
                                                <option value="forceful" ${item.damageType === 'forceful' ? 'selected' : ''}>Forceful</option>
                                                <option value="fire" ${item.damageType === 'fire' ? 'selected' : ''}>Fire</option>
                                                <option value="cold" ${item.damageType === 'cold' ? 'selected' : ''}>Cold</option>
                                                <option value="lightning" ${item.damageType === 'lightning' ? 'selected' : ''}>Lightning</option>
                                                <option value="acid" ${item.damageType === 'acid' ? 'selected' : ''}>Acid</option>
                                                <option value="influence" ${item.damageType === 'influence' ? 'selected' : ''}>Influence</option>
                                                <option value="entropy" ${item.damageType === 'entropy' ? 'selected' : ''}>Entropy</option>
                                            </select>` : ''}
                                        </div>
                                        <div class="weapon-property">
                                            <label><input type="checkbox" class="weapon-property-checkbox" data-equipment-id="${item.id}" data-property="baneful" ${item.properties && item.properties.includes('baneful') ? 'checked' : ''}> Baneful</label>
                                            ${item.properties && item.properties.includes('baneful') ? `<select class="weapon-property-input" data-equipment-id="${item.id}" data-property="baneful" data-field="banefulBane">
                                                <option value="">Select Bane...</option>
                                                ${window.GAME_DATABASE && window.GAME_DATABASE.banes ? window.GAME_DATABASE.banes.map(bane => `<option value="${bane.name}" ${item.banefulBane === bane.name ? 'selected' : ''}>${bane.name}</option>`).join('') : ''}
                                            </select>` : ''}
                                        </div>
                                    </div>
                                </div>

                                <div class="weapon-category-section">
                                    <h4>Weapon Category</h4>
                                    <div class="weapon-category-grid">
                                        <div class="weapon-category">
                                            <label><input type="radio" name="weaponCategory_${item.id}" value="One-Handed Melee" ${item.weaponCategory === 'One-Handed Melee' ? 'checked' : ''}> One-Handed Melee</label>
                                        </div>
                                        <div class="weapon-category">
                                            <label><input type="radio" name="weaponCategory_${item.id}" value="Two-Handed Melee" ${item.weaponCategory === 'Two-Handed Melee' ? 'checked' : ''}> Two-Handed Melee</label>
                                        </div>
                                        <div class="weapon-category">
                                            <label><input type="radio" name="weaponCategory_${item.id}" value="Versatile Melee" ${item.weaponCategory === 'Versatile Melee' ? 'checked' : ''}> Versatile Melee</label>
                                        </div>
                                        <div class="weapon-category">
                                            <label><input type="radio" name="weaponCategory_${item.id}" value="Close Ranged" ${item.weaponCategory === 'Close Ranged' ? 'checked' : ''}> Close Ranged</label>
                                        </div>
                                        <div class="weapon-category">
                                            <label><input type="radio" name="weaponCategory_${item.id}" value="Short Ranged" ${item.weaponCategory === 'Short Ranged' ? 'checked' : ''}> Short Ranged</label>
                                        </div>
                                        <div class="weapon-category">
                                            <label><input type="radio" name="weaponCategory_${item.id}" value="Medium Ranged" ${item.weaponCategory === 'Medium Ranged' ? 'checked' : ''}> Medium Ranged</label>
                                        </div>
                                        <div class="weapon-category">
                                            <label><input type="radio" name="weaponCategory_${item.id}" value="Long Ranged" ${item.weaponCategory === 'Long Ranged' ? 'checked' : ''}> Long Ranged</label>
                                        </div>
                                        <div class="weapon-category">
                                            <label><input type="radio" name="weaponCategory_${item.id}" value="Extreme Ranged" ${item.weaponCategory === 'Extreme Ranged' ? 'checked' : ''}> Extreme Ranged</label>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}

                            <!-- Armor-specific properties -->
                            ${item.type === 'armor' ? `
                                <div class="armor-properties-section">
                                    <h4>Armor Properties</h4>
                                    <div class="armor-properties-grid">
                                        <div class="armor-property">
                                            <label>Armor Defense:</label>
                                            <input type="number" class="armor-defense-input" data-equipment-id="${item.id}" data-field="armorDefense" value="${item.armorDefense || 0}" min="0" max="3">
                                        </div>
                                        <div class="armor-property">
                                            <label>Required Fortitude:</label>
                                            <input type="number" class="required-fortitude-input" data-equipment-id="${item.id}" data-field="requiredFortitude" value="${item.requiredFortitude || 0}" min="0">
                                        </div>
                                        <div class="armor-property">
                                            <label><input type="checkbox" class="speed-reduction-checkbox" data-equipment-id="${item.id}" data-field="speedReduction" ${item.speedReduction ? 'checked' : ''}> Speed Reduction</label>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}

                            <!-- Item-specific properties -->
                            ${item.type === 'item' ? `
                                <div class="item-properties-section">
                                    <h4>Item Properties</h4>
                                    <div class="item-properties-grid">
                                        <div class="item-property">
                                            <label>Attribute Score Setting:</label>
                                            <select class="item-attribute-select" data-equipment-id="${item.id}" data-field="itemAttributeScore">
                                                <option value="none" ${item.itemAttributeScore === 'none' ? 'selected' : ''}>None</option>
                                                <option value="agility" ${item.itemAttributeScore === 'agility' ? 'selected' : ''}>Agility</option>
                                                <option value="fortitude" ${item.itemAttributeScore === 'fortitude' ? 'selected' : ''}>Fortitude</option>
                                                <option value="might" ${item.itemAttributeScore === 'might' ? 'selected' : ''}>Might</option>
                                                <option value="learning" ${item.itemAttributeScore === 'learning' ? 'selected' : ''}>Learning</option>
                                                <option value="logic" ${item.itemAttributeScore === 'logic' ? 'selected' : ''}>Logic</option>
                                                <option value="perception" ${item.itemAttributeScore === 'perception' ? 'selected' : ''}>Perception</option>
                                                <option value="will" ${item.itemAttributeScore === 'will' ? 'selected' : ''}>Will</option>
                                                <option value="deception" ${item.itemAttributeScore === 'deception' ? 'selected' : ''}>Deception</option>
                                                <option value="persuasion" ${item.itemAttributeScore === 'persuasion' ? 'selected' : ''}>Persuasion</option>
                                                <option value="presence" ${item.itemAttributeScore === 'presence' ? 'selected' : ''}>Presence</option>
                                                <option value="alteration" ${item.itemAttributeScore === 'alteration' ? 'selected' : ''}>Alteration</option>
                                                <option value="creation" ${item.itemAttributeScore === 'creation' ? 'selected' : ''}>Creation</option>
                                                <option value="energy" ${item.itemAttributeScore === 'energy' ? 'selected' : ''}>Energy</option>
                                                <option value="entropy" ${item.itemAttributeScore === 'entropy' ? 'selected' : ''}>Entropy</option>
                                                <option value="influence" ${item.itemAttributeScore === 'influence' ? 'selected' : ''}>Influence</option>
                                                <option value="movement" ${item.itemAttributeScore === 'movement' ? 'selected' : ''}>Movement</option>
                                                <option value="prescience" ${item.itemAttributeScore === 'prescience' ? 'selected' : ''}>Prescience</option>
                                                <option value="protection" ${item.itemAttributeScore === 'protection' ? 'selected' : ''}>Protection</option>
                                            </select>
                                        </div>
                                        <div class="item-property">
                                            <label>Power Level (PL):</label>
                                            <select class="item-power-level-select" data-equipment-id="${item.id}" data-field="itemPowerLevel">
                                                <option value="">Choose Power Level...</option>
                                                ${[1,2,3,4,5,6,7,8,9,10].map(pl => `<option value="${pl}" ${item.itemPowerLevel === pl ? 'selected' : ''}>${pl}</option>`).join('')}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}

                            <!-- Universal Properties Section -->
                            <div class="universal-properties-section">
                                <h4>Universal Properties</h4>
                                <div class="universal-properties-grid">
                                    <div class="universal-property">
                                        <label><input type="checkbox" class="universal-property-checkbox" data-equipment-id="${item.id}" data-property="area" ${item.universalProperties && item.universalProperties.includes('area') ? 'checked' : ''}> Area</label>
                                        ${item.universalProperties && item.universalProperties.includes('area') ? `<input type="text" class="universal-property-input" data-equipment-id="${item.id}" data-property="area" data-field="areaSize" value="${item.areaSize || ''}" placeholder="e.g., 10' radius, 15' cone">` : ''}
                                    </div>
                                    <div class="universal-property">
                                        <label><input type="checkbox" class="universal-property-checkbox" data-equipment-id="${item.id}" data-property="autonomous" ${item.universalProperties && item.universalProperties.includes('autonomous') ? 'checked' : ''}> Autonomous</label>
                                    </div>
                                    <div class="universal-property">
                                        <label><input type="checkbox" class="universal-property-checkbox" data-equipment-id="${item.id}" data-property="consumable" ${item.universalProperties && item.universalProperties.includes('consumable') ? 'checked' : ''}> Consumable</label>
                                    </div>
                                    <div class="universal-property">
                                        <label><input type="checkbox" class="universal-property-checkbox" data-equipment-id="${item.id}" data-property="cursed" ${item.universalProperties && item.universalProperties.includes('cursed') ? 'checked' : ''}> Cursed</label>
                                        ${item.universalProperties && item.universalProperties.includes('cursed') ? `
                                            <select class="universal-property-input" data-equipment-id="${item.id}" data-property="cursed" data-field="cursedBane">
                                                <option value="">Select Bane...</option>
                                                ${window.GAME_DATABASE && window.GAME_DATABASE.banes ? window.GAME_DATABASE.banes.map(bane => `<option value="${bane.name}" ${item.cursedBane === bane.name ? 'selected' : ''}>${bane.name}</option>`).join('') : ''}
                                            </select>
                                            <select class="universal-property-input" data-equipment-id="${item.id}" data-property="cursed" data-field="cursedPowerLevel">
                                                <option value="">Power Level...</option>
                                                ${[1,2,3,4,5,6,7,8,9,10].map(pl => `<option value="${pl}" ${item.cursedPowerLevel === pl ? 'selected' : ''}>${pl}</option>`).join('')}
                                            </select>
                                        ` : ''}
                                    </div>
                                    <div class="universal-property">
                                        <label><input type="checkbox" class="universal-property-checkbox" data-equipment-id="${item.id}" data-property="expendable" ${item.universalProperties && item.universalProperties.includes('expendable') ? 'checked' : ''}> Expendable</label>
                                    </div>
                                    <div class="universal-property">
                                        <label><input type="checkbox" class="universal-property-checkbox" data-equipment-id="${item.id}" data-property="persistent" ${item.universalProperties && item.universalProperties.includes('persistent') ? 'checked' : ''}> Persistent</label>
                                        ${item.universalProperties && item.universalProperties.includes('persistent') ? `
                                            <select class="universal-property-input" data-equipment-id="${item.id}" data-property="persistent" data-field="persistentBoon">
                                                <option value="">Select Boon...</option>
                                                ${window.GAME_DATABASE && window.GAME_DATABASE.boons ? window.GAME_DATABASE.boons.map(boon => `<option value="${boon.name}" ${item.persistentBoon === boon.name ? 'selected' : ''}>${boon.name}</option>`).join('') : ''}
                                            </select>
                                            <select class="universal-property-input" data-equipment-id="${item.id}" data-property="persistent" data-field="persistentPowerLevel">
                                                <option value="">Power Level...</option>
                                                ${[1,2,3,4,5,6,7,8,9,10].map(pl => `<option value="${pl}" ${item.persistentPowerLevel === pl ? 'selected' : ''}>${pl}</option>`).join('')}
                                            </select>
                                        ` : ''}
                                    </div>
                                    <div class="universal-property">
                                        <label><input type="checkbox" class="universal-property-checkbox" data-equipment-id="${item.id}" data-property="powerful" ${item.universalProperties && item.universalProperties.includes('powerful') ? 'checked' : ''}> Powerful</label>
                                        ${item.universalProperties && item.universalProperties.includes('powerful') ? `<input type="number" class="universal-property-input" data-equipment-id="${item.id}" data-property="powerful" data-field="powerfulValue" value="${item.powerfulValue || 1}" min="1" max="3">` : ''}
                                    </div>
                                    <div class="universal-property">
                                        <label><input type="checkbox" class="universal-property-checkbox" data-equipment-id="${item.id}" data-property="reliable" ${item.universalProperties && item.universalProperties.includes('reliable') ? 'checked' : ''}> Reliable</label>
                                    </div>
                                    <div class="universal-property">
                                        <label><input type="checkbox" class="universal-property-checkbox" data-equipment-id="${item.id}" data-property="sentient" ${item.universalProperties && item.universalProperties.includes('sentient') ? 'checked' : ''}> Sentient</label>
                                    </div>
                                </div>
                            </div>

                            <!-- Save Changes Button -->
                            <div class="equipment-save-section">
                                <button class="btn btn-primary save-equipment-btn" onclick="window.app.saveEquipmentChanges('${item.id}')">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                        
                        <!-- View mode display with spans showing textarea content -->

                    </div>
                </div>
                <div class="equipment-actions">
                    <button class="btn btn-small btn-secondary view-mode-btn" onclick="window.app.toggleEquipmentDetails('${item.id}')">
                        Details
                    </button>
                    <button class="btn btn-small ${item.equipped ? 'btn-secondary' : 'btn-success'} view-mode-btn" 
                            onclick="window.app.toggleEquipment('${item.id}')">
                        ${item.equipped ? 'Unequip' : 'Equip'}
                    </button>
                    <button class="btn btn-small btn-danger view-mode-btn" onclick="window.app.removeEquipment('${item.id}')">
                        ×
                    </button>
                </div>
            `;
            
            equipmentList.appendChild(itemElement);
        });
        
        this.updateEquippedDisplay();
    }

    // Toggle equipment details display
    toggleEquipmentDetails(equipmentId) {
        const equipment = this.currentCharacter.equipment.find(e => e.id === equipmentId);
        if (equipment) {
            const detailsElement = document.querySelector(`[onclick="window.app.toggleEquipmentDetails('${equipmentId}')"]`).closest('.equipment-item').querySelector('.equipment-details');
            if (detailsElement.style.display === 'none') {
                detailsElement.style.display = 'block';
            } else {
                detailsElement.style.display = 'none';
            }
        }
    }

    // Update equipment display for view mode
    updateEquipmentViewMode() {
        const isViewMode = document.body.classList.contains('view-mode');
        const equipmentDetails = document.querySelectorAll('.equipment-details');
        const compactDetails = document.querySelectorAll('.equipment-details-compact');
        const fullDetails = document.querySelectorAll('.equipment-details-full');
        
        // Update equipment view mode
        
        equipmentDetails.forEach(details => {
            details.style.display = isViewMode ? 'block' : 'none';
        });
        
        compactDetails.forEach(details => {
            details.style.display = isViewMode ? 'flex' : 'none';
        });
        
        fullDetails.forEach(details => {
            details.style.display = isViewMode ? 'none' : 'block';
        });
        
        // Force update the display based on current view mode
        if (isViewMode) {
            // In view mode, ensure compact details are visible and full details are hidden
            compactDetails.forEach(details => {
                details.style.display = 'flex';
            });
            fullDetails.forEach(details => {
                details.style.display = 'none';
            });
        } else {
            // In edit mode, ensure full details are visible and compact details are hidden
            compactDetails.forEach(details => {
                details.style.display = 'none';
            });
            fullDetails.forEach(details => {
                details.style.display = 'block';
            });
        }
    }

    // Update equipped display
    updateEquippedDisplay() {
        if (!this.currentCharacter) return;
        
        const weapons = this.currentCharacter.equipment.filter(e => e.equipped && e.type === 'weapon');
        const armor = this.currentCharacter.equipment.find(e => e.equipped && e.type === 'armor');
        const accessories = this.currentCharacter.equipment.filter(e => e.equipped && e.type === 'item');
        
        // Display weapons (up to 2)
        const equippedWeapon = document.getElementById('equippedWeapon');
        if (equippedWeapon) {
            if (weapons.length === 0) {
                equippedWeapon.textContent = 'None';
            } else if (weapons.length === 1) {
                equippedWeapon.textContent = weapons[0].name;
            } else {
                equippedWeapon.textContent = `${weapons[0].name} & ${weapons[1].name}`;
            }
        }
        
        document.getElementById('equippedArmor').textContent = armor ? armor.name : 'None';
        
        const accessoriesList = document.getElementById('equippedAccessories');
        accessoriesList.innerHTML = '';
        accessories.forEach(acc => {
            const accElement = document.createElement('div');
            accElement.className = 'equipped-item';
            accElement.textContent = acc.name;
            accessoriesList.appendChild(accElement);
        });
    }

    // Toggle equipment equipped status
    toggleEquipment(equipmentId) {
        if (!this.currentCharacter) return;
        
        const equipment = this.currentCharacter.equipment.find(e => e.id === equipmentId);
        if (equipment) {
            // Check if trying to equip armor
            if (equipment.type === 'armor' && !equipment.equipped) {
                // Check fortitude requirement (with Armor Mastery feat reduction)
                let requiredFortitude = equipment.requiredFortitude || 0;
                const armorMasteryFeat = this.currentCharacter.feats && this.currentCharacter.feats.find(feat => feat.name === 'Armor Mastery');
                if (armorMasteryFeat && armorMasteryFeat.tier) {
                    requiredFortitude = Math.max(0, requiredFortitude - armorMasteryFeat.tier);
                }
                
                if (requiredFortitude > this.currentCharacter.attributes.fortitude) {
                    this.showNotification(`Cannot equip ${equipment.name}. Required Fortitude: ${equipment.requiredFortitude} (reduced to ${requiredFortitude} with Armor Mastery), Current: ${this.currentCharacter.attributes.fortitude}`, 'error');
                    return;
                }
                
                // Unequip any existing armor before equipping new one
                const existingArmor = this.currentCharacter.equipment.find(e => e.equipped && e.type === 'armor');
                if (existingArmor) {
                    existingArmor.equipped = false;
                    this.showNotification(`Unequipped ${existingArmor.name} to equip ${equipment.name}`, 'info');
                }
            }
            
            // Check if trying to equip weapon and already have 2 equipped
            if (equipment.type === 'weapon' && !equipment.equipped) {
                const equippedWeapons = this.currentCharacter.equipment.filter(e => e.equipped && e.type === 'weapon');
                if (equippedWeapons.length >= 2) {
                    this.showNotification('Cannot equip more than 2 weapons. Unequip one first.', 'error');
                    return;
                }
                
                // Check Two Weapon Brute restrictions
                const hasTwoWeaponBrute = this.currentCharacter.feats && this.currentCharacter.feats.some(feat => feat.name === 'Two Weapon Brute');
                
                if (!hasTwoWeaponBrute) {
                    // Check if trying to equip a two-handed weapon while having another weapon equipped
                    const isTwoHanded = equipment.weaponCategory === 'two-handed-melee';
                    if (isTwoHanded && equippedWeapons.length > 0) {
                        this.showNotification('Cannot equip a two-handed weapon while having another weapon equipped. You need the "Two Weapon Brute" feat to wield two weapons together.', 'error');
                        return;
                    }
                    
                    // Check if trying to equip any weapon while having a two-handed weapon equipped
                    const hasTwoHandedEquipped = equippedWeapons.some(weapon => weapon.weaponCategory === 'two-handed-melee');
                    if (hasTwoHandedEquipped) {
                        this.showNotification('Cannot equip another weapon while wielding a two-handed weapon. You need the "Two Weapon Brute" feat to wield two weapons together.', 'error');
                        return;
                    }
                }
            }
            
            // Handle stacking/splitting for quantities > 1
            const quantity = equipment.quantity || 1;
            
            if (!equipment.equipped && quantity > 1) {
                // Equipping: Split one item from the stack
                equipment.quantity = quantity - 1;
                
                // Create a new equipment item for the equipped one
                const equippedItem = JSON.parse(JSON.stringify(equipment));
                equippedItem.id = this.generateUniqueEquipmentId();
                equippedItem.quantity = 1;
                equippedItem.equipped = true;
                
                this.currentCharacter.equipment.push(equippedItem);
            } else if (equipment.equipped) {
                // Unequipping: Try to stack with identical unequipped items
                equipment.equipped = false;
                
                const identicalItem = this.findIdenticalUnequippedItem(equipment);
                if (identicalItem && identicalItem.id !== equipment.id) {
                    // Stack with existing item
                    identicalItem.quantity = (identicalItem.quantity || 1) + 1;
                    
                    // Remove the unequipped item
                    const index = this.currentCharacter.equipment.findIndex(e => e.id === equipment.id);
                    if (index !== -1) {
                        this.currentCharacter.equipment.splice(index, 1);
                    }
                } else {
                    // No identical item found, just mark as unequipped
                    equipment.quantity = 1;
                }
            } else {
                // Single item with quantity 1, just toggle
                equipment.equipped = true;
            }
            
            // Handle cursed item logic
            // Equipment cursed check
            
            if (equipment.universalProperties && equipment.universalProperties.includes('cursed')) {
                // Cursed item detected, processing bane logic...
                if (equipment.equipped) {
                    // Add cursed bane to active banes
                    // Equipping cursed item, adding bane...
                    this.addCursedBane(equipment);
                } else {
                    // Remove cursed bane from active banes
                    // Unequipping cursed item, removing bane...
                    this.removeCursedBane(equipment);
                }
            } else {
                // Item is not cursed or has no universal properties
            }
            
            // Handle persistent item logic
            if (equipment.universalProperties && equipment.universalProperties.includes('persistent')) {
                // Persistent item detected, processing boon logic...
                if (equipment.equipped) {
                    // Add persistent boon to available boons
                    // Equipping persistent item, adding boon...
                    this.addPersistentBoon(equipment);
                } else {
                    // Remove persistent boon from available boons
                    // Unequipping persistent item, removing boon...
                    this.removePersistentBoon(equipment);
                }
            }
            
            // Handle reliable item logic
            if (equipment.universalProperties && equipment.universalProperties.includes('reliable')) {
                // Reliable item detected, processing boon logic...
                // Equipment reliable properties
                if (equipment.equipped) {
                    // Add reliable boon to available boons (but not to active boons)
                    // Equipping reliable item, adding boon to available boons...
                    this.addReliableBoon(equipment);
                } else {
                    // Remove reliable boon from available boons
                    // Unequipping reliable item, removing boon...
                    this.removeReliableBoon(equipment);
                }
            }
            
            if (equipment.type === 'armor') {
                if (equipment.equipped) {
                    // Armor equipped
                } else {
                    // Armor unequipped
                }
            }
            
            this.populateEquipment();
            this.updateDefenseStats();
            this.updateMovementStats();
            this.updateAttributeDisplay(); // Update attribute display to reflect equipment changes
            this.updateWeaponAdvantageDisplay(); // Update weapon advantage display
            this.populateAdvantages(); // Update advantages for weapon-based advantages (deadly, two-handed, dual-wield)
            this.autoSave();
        }
    }

    // Remove equipment
    removeEquipment(equipmentId) {
        if (!this.currentCharacter) return;
        
        // Check if this equipment is cursed and equipped before removing it
        const equipmentToRemove = this.currentCharacter.equipment.find(e => e.id === equipmentId);
        if (equipmentToRemove && 
            equipmentToRemove.universalProperties && 
            equipmentToRemove.universalProperties.includes('cursed') && 
            equipmentToRemove.equipped) {
            
            // Removing equipped cursed item, cleaning up bane...
            // Remove the associated cursed bane
            this.removeCursedBane(equipmentToRemove);
        }
        
        // Check if this equipment is persistent and equipped before removing it
        if (equipmentToRemove && 
            equipmentToRemove.universalProperties && 
            equipmentToRemove.universalProperties.includes('persistent') && 
            equipmentToRemove.equipped) {
            
            // Remove the associated persistent boon
            this.removePersistentBoon(equipmentToRemove);
        }
        
        // Check if this equipment is reliable and equipped before removing it
        if (equipmentToRemove && 
            equipmentToRemove.universalProperties && 
            equipmentToRemove.universalProperties.includes('reliable') && 
            equipmentToRemove.equipped) {
            
            // Remove the associated reliable boon
            this.removeReliableBoon(equipmentToRemove);
        }
        
        // Remove the equipment
        this.currentCharacter.equipment = this.currentCharacter.equipment.filter(e => e.id !== equipmentId);
        
        // Clean up any orphaned cursed banes (in case there were any)
        this.cleanupOrphanedCursedBanes();
        
        // Clean up any orphaned persistent boons (in case there were any)
        this.cleanupOrphanedPersistentBoons();
        
        this.populateEquipment();
        this.updateDefenseStats();
        this.updateMovementStats();
        this.updateAttributeDisplay(); // Update attribute display when equipment is removed
        this.updateWeaponAdvantageDisplay(); // Update weapon advantage display
        this.populateAdvantages(); // Update advantages for weapon-based advantages (deadly, two-handed, dual-wield)
        
        // Validate boons and banes after equipment removal
        this.validateBoonsAndBanes();
        
        // Sync equipment to related characters
        this.syncEquipmentToRelatedCharacters();
        
        this.autoSave();
        
        this.showNotification('Equipment removed.', 'success');
    }

    // Save equipment changes
    saveEquipmentChanges(equipmentId) {
        if (!this.currentCharacter) return;
        
        const equipment = this.currentCharacter.equipment.find(e => e.id === equipmentId);
        if (!equipment) return;
        
        
        // Get the equipment item element
        const equipmentElement = document.querySelector(`[data-equipment-id="${equipmentId}"]`).closest('.equipment-item');
        
        // Update basic information
        const nameInput = equipmentElement.querySelector('.equipment-name-input');
        const quantityInput = equipmentElement.querySelector('.equipment-quantity-input');
        const typeInput = equipmentElement.querySelector('.equipment-type-select');
        const wealthInput = equipmentElement.querySelector('.equipment-wealth-input');
        const effectsField = equipmentElement.querySelector('.equipment-effects-edit');

        if (nameInput) equipment.name = nameInput.value;
        if (quantityInput) equipment.quantity = Math.max(1, parseInt(quantityInput.value) || 1);
        if (typeInput) equipment.type = typeInput.value;
        if (wealthInput) equipment.wealthLevel = parseInt(wealthInput.value) || 0;
        if (effectsField) equipment.effects = effectsField.value.trim();
        
        // Handle weapon properties
        if (equipment.type === 'weapon') {
            // Get weapon category
            const categoryInputs = equipmentElement.querySelectorAll(`input[name="weaponCategory_${equipmentId}"]:checked`);
            if (categoryInputs.length > 0) {
                equipment.weaponCategory = categoryInputs[0].value;
            }

            // Get weapon properties
            const weaponPropertyCheckboxes = equipmentElement.querySelectorAll('.weapon-property-checkbox:checked');
            equipment.properties = Array.from(weaponPropertyCheckboxes).map(cb => cb.dataset.property);

            // Get property values
            if (equipment.properties.includes('defensive')) {
                const defensiveInput = equipmentElement.querySelector(`[data-property="defensive"][data-field="defensiveValue"]`);
                if (defensiveInput) equipment.defensiveValue = parseInt(defensiveInput.value) || 1;
            }

            if (equipment.properties.includes('deadly')) {
                const deadlyInput = equipmentElement.querySelector(`[data-property="deadly"][data-field="deadlyValue"]`);
                if (deadlyInput) equipment.deadlyValue = parseInt(deadlyInput.value) || 1;
            }

            if (equipment.properties.includes('damageType')) {
                const damageTypeInput = equipmentElement.querySelector(`[data-property="damageType"][data-field="damageType"]`);
                if (damageTypeInput) equipment.damageType = damageTypeInput.value;
            }

            if (equipment.properties.includes('baneful')) {
                const banefulInput = equipmentElement.querySelector(`[data-property="baneful"][data-field="banefulBane"]`);
                if (banefulInput) equipment.banefulBane = banefulInput.value;
            }
        }

        // Handle armor properties
        if (equipment.type === 'armor') {
            const armorDefenseInput = equipmentElement.querySelector('.armor-defense-input');
            const requiredFortitudeInput = equipmentElement.querySelector('.required-fortitude-input');
            const speedReductionInput = equipmentElement.querySelector('.speed-reduction-checkbox');

            if (armorDefenseInput) equipment.armorDefense = parseInt(armorDefenseInput.value) || 0;
            if (requiredFortitudeInput) equipment.requiredFortitude = parseInt(requiredFortitudeInput.value) || 0;
            if (speedReductionInput) equipment.speedReduction = speedReductionInput.checked;
        }

        // Handle item properties
        if (equipment.type === 'item') {
            const attributeInput = equipmentElement.querySelector('.item-attribute-select');
            const powerLevelInput = equipmentElement.querySelector('.item-power-level-select');

            if (attributeInput) equipment.itemAttributeScore = attributeInput.value;
            if (powerLevelInput) equipment.itemPowerLevel = parseInt(powerLevelInput.value) || null;
        }

        // Handle universal properties
        const universalPropertyCheckboxes = equipmentElement.querySelectorAll('.universal-property-checkbox:checked');
        equipment.universalProperties = Array.from(universalPropertyCheckboxes).map(cb => cb.dataset.property);

        // Get universal property values
        if (equipment.universalProperties.includes('area')) {
            const areaInput = equipmentElement.querySelector(`[data-property="area"][data-field="areaSize"]`);
            if (areaInput) equipment.areaSize = areaInput.value;
        }

        if (equipment.universalProperties.includes('powerful')) {
            const powerfulInput = equipmentElement.querySelector(`[data-property="powerful"][data-field="powerfulValue"]`);
            if (powerfulInput) equipment.powerfulValue = parseInt(powerfulInput.value) || 1;
        }

        if (equipment.universalProperties.includes('cursed')) {
            const cursedBaneInput = equipmentElement.querySelector(`[data-property="cursed"][data-field="cursedBane"]`);
            const cursedPowerLevelInput = equipmentElement.querySelector(`[data-property="cursed"][data-field="cursedPowerLevel"]`);

            if (cursedBaneInput) equipment.cursedBane = cursedBaneInput.value;
            if (cursedPowerLevelInput) equipment.cursedPowerLevel = parseInt(cursedPowerLevelInput.value) || 1;
        }

        if (equipment.universalProperties.includes('persistent')) {
            const persistentBoonInput = equipmentElement.querySelector(`[data-property="persistent"][data-field="persistentBoon"]`);
            const persistentPowerLevelInput = equipmentElement.querySelector(`[data-property="persistent"][data-field="persistentPowerLevel"]`);

            if (persistentBoonInput) equipment.persistentBoon = persistentBoonInput.value;
            if (persistentPowerLevelInput) equipment.persistentPowerLevel = parseInt(persistentPowerLevelInput.value) || 1;
        }
        
        if (equipment.universalProperties.includes('reliable')) {
            const reliableBoonInput = equipmentElement.querySelector(`[data-property="reliable"][data-field="reliableBoon"]`);
            const reliablePowerLevelInput = equipmentElement.querySelector(`[data-property="reliable"][data-field="reliablePowerLevel"]`);

            if (reliableBoonInput) equipment.reliableBoon = reliableBoonInput.value;
            if (reliablePowerLevelInput) equipment.reliablePowerLevel = parseInt(reliablePowerLevelInput.value) || 1;
        }
        
        // Refresh the display and auto-save
        this.populateEquipment();
        this.updateDefenseStats();
        this.updateMovementStats();
        this.updateAttributeDisplay(); // Update attribute display when equipment is modified
        this.updateWeaponAdvantageDisplay(); // Update weapon advantage display
        this.populateAdvantages(); // Update advantages for weapon-based advantages (deadly, two-handed, dual-wield)
        this.autoSave();
        
        this.showNotification('Equipment updated successfully!', 'success');
        
        // Equipment updated
    }

    // Setup equipment edit form event listeners
    setupEquipmentEditListeners() {
        // Weapon property checkboxes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('weapon-property-checkbox')) {
                const equipmentId = e.target.dataset.equipmentId;
                const property = e.target.dataset.property;
                const isChecked = e.target.checked;
                
                this.toggleWeaponPropertyInputs(equipmentId, property, isChecked);
            }
        });

        // Universal property checkboxes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('universal-property-checkbox')) {
                const equipmentId = e.target.dataset.equipmentId;
                const property = e.target.dataset.property;
                const isChecked = e.target.checked;
                
                this.toggleUniversalPropertyInputs(equipmentId, property, isChecked);
            }
        });

        // Equipment type change
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('equipment-type-select')) {
                const equipmentId = e.target.dataset.equipmentId;
                const newType = e.target.value;
                
                this.handleEquipmentTypeChange(equipmentId, newType);
            }
        });
    }

    // Toggle weapon property input fields
    toggleWeaponPropertyInputs(equipmentId, property, isChecked) {
        const inputField = document.querySelector(`[data-equipment-id="${equipmentId}"][data-property="${property}"]`);
        if (inputField) {
            inputField.style.display = isChecked ? 'block' : 'none';
        }
        
        // Update weapon advantage display in real-time when swift/slow properties change
        if (property === 'swift' || property === 'slow') {
            this.updateWeaponAdvantageDisplay();
        }
    }

    // Toggle universal property input fields
    toggleUniversalPropertyInputs(equipmentId, property, isChecked) {
        const inputFields = document.querySelectorAll(`[data-equipment-id="${equipmentId}"][data-property="${property}"]`);
        inputFields.forEach(field => {
            field.style.display = isChecked ? 'block' : 'none';
        });
    }

    // Handle equipment type change
    handleEquipmentTypeChange(equipmentId, newType) {
        const equipment = this.currentCharacter.equipment.find(e => e.id === equipmentId);
        if (!equipment) return;

        // Store original type for cleanup
        if (!equipment.originalType) {
            equipment.originalType = equipment.type;
        }

        // Clear type-specific properties
        if (newType !== 'weapon') {
            delete equipment.weaponCategory;
            delete equipment.properties;
            delete equipment.defensiveValue;
            delete equipment.deadlyValue;
            delete equipment.damageType;
            delete equipment.banefulBane;
        }

        if (newType !== 'armor') {
            delete equipment.armorDefense;
            delete equipment.requiredFortitude;
            delete equipment.speedReduction;
        }

        if (newType !== 'item') {
            delete equipment.itemAttributeScore;
            delete equipment.itemPowerLevel;
        }

        // Update equipment type
        equipment.type = newType;

        // Refresh the display to show new form fields
        this.populateEquipment();
    }

    // Add feat
    addFeat() {
        if (!this.currentCharacter) return;
        
        const featSelect = document.getElementById('featSelect');
        const tierSelect = document.getElementById('featTierSelect');
        
        const selectedFeatName = featSelect.value;
        const selectedTier = parseInt(tierSelect.value) || 0;
        
        if (!selectedFeatName || !selectedTier) {
            this.showNotification('Please select a feat and tier.', 'error');
            return;
        }
        
        const databaseFeat = window.GAME_DATABASE.feats.find(f => f.name === selectedFeatName);
        if (!databaseFeat) {
            this.showNotification('Selected feat not found in database.', 'error');
            return;
        }
        
        const cost = databaseFeat.cost * selectedTier;
        
        // Skip validation if in manual mode
        if (!this.currentCharacter.manualSettings) {
            // Check if character meets requirements for this tier
            if (!this.meetsFeatRequirements(databaseFeat, selectedTier)) {
                this.showNotification('Character does not meet the requirements for this feat tier.', 'error');
                return;
            }
        }
        
        // Ensure usedFeatPoints is initialized
        if (this.currentCharacter.usedFeatPoints === undefined) {
            this.currentCharacter.usedFeatPoints = 0;
        }
        
        // Check if character has enough feat points (respect alternate form and companion limitations)
        const availableFeatPoints = this.getCharacterAvailableFeatPoints(this.currentCharacter);
        const remainingFeatPoints = availableFeatPoints - this.currentCharacter.usedFeatPoints;
        
        // Skip feat point validation if in manual mode
        if (!this.currentCharacter.manualSettings) {
            // Additional validation for Tier 3 companions to prevent borrowing more than parent has available
            if (this.currentCharacter.isCompanion && this.currentCharacter.companionTier === 3) {
                const companionOwnPoints = this.currentCharacter.maxFeatPoints;
                const wouldUsePoints = this.currentCharacter.usedFeatPoints + cost;
                
                if (wouldUsePoints > companionOwnPoints) {
                    // Companion would be borrowing from parent, check if parent has enough
                    const parent = this.characters.find(char => char.id === this.currentCharacter.parentCharacterId);
                    if (parent) {
                        const parentBasePoints = 6 + parent.experiencePoints;
                        const parentAvailablePoints = parentBasePoints - parent.usedFeatPoints;
                        const pointsToBorrow = wouldUsePoints - companionOwnPoints;
                        
                        if (pointsToBorrow > parentAvailablePoints) {
                            this.showNotification(`Not enough parent feat points available to borrow. Parent has ${parentAvailablePoints} available, but you need to borrow ${pointsToBorrow}.`, 'error');
                            return;
                        }
                    }
                }
            }
            
            if (cost > remainingFeatPoints) {
                this.showNotification(`Not enough feat points available. You have ${remainingFeatPoints} remaining.`, 'error');
                return;
            }
        }
        

        
        // Get custom input - handle Attribute Substitution differently
        let customDetails = '';
        
        if (selectedFeatName === 'Attribute Substitution') {
            // Handle Attribute Substitution dropdowns
            const fromAttribute = document.getElementById('substitutionFromAttribute').value;
            const toAttribute = document.getElementById('substitutionToAttribute').value;
            
            if (!fromAttribute || !toAttribute) {
                this.showNotification('Please select both source and target attributes for Attribute Substitution.', 'error');
                return;
            }
            
            if (fromAttribute === toAttribute) {
                this.showNotification('Source and target attributes must be different.', 'error');
                return;
            }
            
            customDetails = `${fromAttribute}->${toAttribute}`;
        } else if (selectedFeatName === 'Bane Focus') {
            // Handle Bane Focus dropdown
            const selectedBane = document.getElementById('baneFocusSelection').value;
            
            if (!selectedBane) {
                this.showNotification('Please select a bane for Bane Focus.', 'error');
                return;
            }
            
            customDetails = selectedBane;
        } else if (selectedFeatName === 'Battlefield Punisher') {
            // Handle Battlefield Punisher dropdown
            const selectedBane = document.getElementById('battlefieldPunisherSelection').value;
            
            if (!selectedBane) {
                this.showNotification('Please select a bane for Battlefield Punisher.', 'error');
                return;
            }
            
            customDetails = selectedBane;
        } else if (selectedFeatName === 'Boon Access') {
            // Handle Boon Access dropdown
            const selectedBoon = document.getElementById('boonAccessSelection').value;
            
            if (!selectedBoon) {
                this.showNotification('Please select a boon for Boon Access.', 'error');
                return;
            }
            
            customDetails = selectedBoon;
        } else if (selectedFeatName === 'Boon Focus') {
            // Handle Boon Focus dropdown
            const selectedBoon = document.getElementById('boonFocusSelection').value;
            
            if (!selectedBoon) {
                this.showNotification('Please select a boon for Boon Focus.', 'error');
                return;
            }
            
            customDetails = selectedBoon;
        } else if (selectedFeatName === 'Extraordinary Focus') {
            // Handle Extraordinary Focus dropdown
            const selectedAttribute = document.getElementById('extraordinaryFocusSelection').value;
            
            if (!selectedAttribute) {
                this.showNotification('Please select an attribute for Extraordinary Focus.', 'error');
                return;
            }
            
            customDetails = selectedAttribute;
        } else if (selectedFeatName === 'Multi-Bane Specialist') {
            // Handle Multi-Bane Specialist dropdowns
            const selectedBane1 = document.getElementById('multiBaneSpecialistBane1').value;
            const selectedBane2 = document.getElementById('multiBaneSpecialistBane2').value;
            
            if (!selectedBane1 || !selectedBane2) {
                this.showNotification('Please select both banes for Multi-Bane Specialist.', 'error');
                return;
            }
            
            if (selectedBane1 === selectedBane2) {
                this.showNotification('Please select two different banes for Multi-Bane Specialist.', 'error');
                return;
            }
            
            customDetails = `${selectedBane1}|${selectedBane2}`;
        } else if (selectedFeatName === 'Potent Bane') {
            // Handle Potent Bane dropdown
            const selectedBane = document.getElementById('potentBaneSelection').value;
            
            if (!selectedBane) {
                this.showNotification('Please select a bane for Potent Bane.', 'error');
                return;
            }
            
            customDetails = selectedBane;
        } else if (selectedFeatName === 'Skill Specialization') {
            // Handle Skill Specialization dropdown
            const selectedAttribute = document.getElementById('skillSpecializationSelection').value;
            
            if (!selectedAttribute) {
                this.showNotification('Please select an attribute for Skill Specialization.', 'error');
                return;
            }
            
            customDetails = selectedAttribute;
        } else if (selectedFeatName === 'Alternate Form') {
            // Handle Alternate Form - create new character
            const customInputField = document.getElementById('featCustomInputField');
            const alternateFormName = customInputField ? customInputField.value.trim() : '';
            
            if (!alternateFormName) {
                this.showNotification('Please enter a name for your alternate form.', 'error');
                return;
            }
            
            // Create the alternate form character with tier based on the Alternate Form feat tier
            const alternateFormCharacter = this.createAlternateFormCharacter(alternateFormName, selectedTier);
            customDetails = alternateFormName;
            
            // Store reference to the alternate form character ID
            if (!this.currentCharacter.alternateForms) {
                this.currentCharacter.alternateForms = [];
            }
            this.currentCharacter.alternateForms.push({
                name: alternateFormName,
                characterId: alternateFormCharacter.id,
                tier: selectedTier
            });
            
            // Also store reference in the alternate form character
            alternateFormCharacter.alternateFormReferences = this.currentCharacter.alternateForms;
            
            // Ensure all characters in the tree are linked for synchronization
            this.linkAllCharactersForSync(alternateFormCharacter);
            
            // Update the switch buttons to show the new alternate form
            this.updateAlternateFormSwitch();
            
        } else if (selectedFeatName === 'Companion') {
            // Handle Companion - create new companion character
            const customInputField = document.getElementById('featCustomInputField');
            const companionName = customInputField ? customInputField.value.trim() : '';
            
            if (!companionName) {
                this.showNotification('Please enter a name for your companion.', 'error');
                return;
            }
            
            // Create the companion character with tier based on the Companion feat tier
            const companionCharacter = this.createCompanionCharacter(companionName, selectedTier);
            customDetails = companionName;
            
            // The companion has already been linked to the parent character in createCompanionCharacter
            // No need to add it again here
            
            // Ensure all characters in the tree are linked for synchronization
            this.linkAllCharactersForSync(companionCharacter);
            
            // Update the switch buttons to show the new companion
            this.updateCompanionSwitch();
            
        } else {
            // Handle normal custom input
            const customInputField = document.getElementById('featCustomInputField');
            customDetails = customInputField ? customInputField.value.trim() : '';
            
            // Check if this feat requires custom input
            if (databaseFeat.customInput && !customDetails) {
                this.showNotification('Please enter the required custom details for this feat.', 'error');
                return;
            }
            
            // For feats without customInput, customDetails can be empty
            if (!customDetails) {
                customDetails = ''; // Allow empty custom details for most feats
            }
        }
        
        // Check if this feat should hide the custom input field (same list as above)
        const featsWithoutCustomInput = [
            'Area Manipulation', 'Armor Mastery', 'Attack Redirection', 'Battle Trance',
            'Battlefield Opportunist', 'Battlefield Retribution', 'Breakfall', 'Brutal Intimidation',
            'Climbing', 'Combat Follow-through', 'Combat Momentum', 'Craft Extraordinary Item',
            'Crushing Blow', 'Death Blow', 'Deathless Trance', 'Defensive Mastery',
            'Defensive Reflexes', 'Destructive Trance', 'Diehard', 'Evasive Footwork',
            'Extraordinary Defense', 'Extraordinary Healing', 'Fast Draw', 'Fast Tracker',
            'Ferocious Minions', 'Fleet of Foot', 'Flying', 'Great Leap', 'Hallucination',
            'Heightened Invocation', 'Hospitaler', 'Impervious Trance', 'Indomitable Endurance',
            'Indomitable Resolve', 'Inspiring Champion', 'Lethal Strike', 'Lightning Reflexes',
            'Silencing Strike', 'Master Tracker', 'Mimic', 'Multi-Attack Specialist',
            'Multi-Target Boon Expert', 'Multi-Target Boon Specialist', 'Natural Defense',
            'Overpowering Strike', 'Reactionary Trance', 'Reckless Attack', 'Resilient',
            'Sentinel', 'Superior Concentration', 'Swimming', 'Tough as Nails',
            'Two Weapon Brute', 'Two Weapon Defense', 'Unending Charm', 'Untrackable',
            'Vicious Strike', 'Wealthy', 'Well-Rounded'
        ];
        
        const shouldHideCustomInput = featsWithoutCustomInput.some(featName => 
            selectedFeatName.startsWith(featName)
        );
        
        // For feats that hide custom input, always set customDetails to empty
        if (shouldHideCustomInput) {
            customDetails = '';
        }
        
        const feat = {
            id: Date.now().toString(),
            name: selectedFeatName,
            tier: selectedTier,
            cost: cost,
            description: databaseFeat.description,
            prerequisites: this.formatPrerequisites(databaseFeat.prerequisites),
            effect: databaseFeat.effects && databaseFeat.effects[selectedTier] ? databaseFeat.effects[selectedTier] : 'No tier effect available.',
            effectDescription: databaseFeat.effectDescription || 'No effect description available.',
            effects: databaseFeat.effects || {},
            customDetails: customDetails
        };
        

        
        this.currentCharacter.feats.push(feat);
        this.currentCharacter.usedFeatPoints += cost;
        
        // Track parent's own used feat points separately from companion spending
        if (this.currentCharacter.companions && this.currentCharacter.companions.length > 0) {
            if (!this.currentCharacter.ownUsedFeatPoints) {
                this.currentCharacter.ownUsedFeatPoints = 0;
            }
            this.currentCharacter.ownUsedFeatPoints += cost;
        }
        
        // Handle Tier 3 companion feat point borrowing from parent
        if (this.currentCharacter.isCompanion && this.currentCharacter.companionTier === 3) {
            const companionOwnPoints = this.currentCharacter.maxFeatPoints;
            if (this.currentCharacter.usedFeatPoints > companionOwnPoints) {
                // Companion is using parent's feat points - increase parent's used feat points
                const pointsFromParent = this.currentCharacter.usedFeatPoints - companionOwnPoints;
                
                const parent = this.characters.find(char => char.id === this.currentCharacter.parentCharacterId);
                if (parent) {
                    if (!this.currentCharacter.featPointsFromParent) {
                        this.currentCharacter.featPointsFromParent = 0;
                    }
                    
                    // Calculate how many new points are being borrowed
                    const previousPointsFromParent = this.currentCharacter.featPointsFromParent;
                    const newPointsBorrowed = pointsFromParent - previousPointsFromParent;
                    
                    // Update parent's used feat points
                    parent.usedFeatPoints += newPointsBorrowed;
                    this.currentCharacter.featPointsFromParent = pointsFromParent;
                    
                    
                }
            }
        }
        
        this.populateFeats();
        this.updateFeatPointsDisplay();
        this.updateDefenseStats();
        this.updateMovementStats(); // Update movement stats in case Flying feat was added
        this.populateFeatsDropdown(); // Refresh available feats dropdown
        this.populateAdvantages(); // Update advantages for feat-based advantages
        this.updateWeaponAdvantageDisplay(); // Update initiative advantages for Lightning Reflexes
        this.updateMaxHP(); // Update max HP in case Tough as Nails feat was added
        this.populateEquipment(); // Update equipment display in case Two Weapon Brute feat was added
        this.updateWealthDisplay(); // Update wealth display in case Wealthy feat was added
        this.updateWellRoundedDescription(); // Update Well-Rounded description visibility
        this.updateAttributeSubstitutionDisplays(); // Update attribute substitution displays
        this.populateAvailableBoonsAndBanes(); // Refresh available boons/banes for Attribute Substitution
        
        // Refresh base actions to show new feat notes
        if (this.hasFeatsAffectingBaseActions()) {
            this.populateBaseActions();
        }
        
        // Update feat icons
        this.updateFeatIcons();
        
        this.autoSave();
        
        // Reset form
        featSelect.value = '';
        tierSelect.innerHTML = '<option value="">Choose tier...</option>';
        document.getElementById('featCostDisplay').textContent = '0';
        document.getElementById('addFeatBtn').disabled = true;
        
        // Reset custom input field if it exists
        const customInputField = document.getElementById('featCustomInputField');
        if (customInputField) {
            customInputField.value = '';
        }
        
        document.getElementById('featPreview').style.display = 'none';
        document.getElementById('featCustomInput').style.display = 'none';
        
        this.showNotification(`Added feat: ${selectedFeatName} (Tier ${this.getRomanNumeral(selectedTier)})`, 'success');
    }

    // Format prerequisites for display
    formatPrerequisites(prerequisites) {
        if (!prerequisites) return null;
        
        let formatted = '<ul>';
        
        if (prerequisites.attributes && prerequisites.attributes.length > 0) {
            const powerLevel = prerequisites.powerLevel || '?';
            formatted += `<li>${prerequisites.attributes.map(attr => attr.charAt(0).toUpperCase() + attr.slice(1)).join(', ')} [${powerLevel}]</li>`;
        }
        
        if (prerequisites.feats && prerequisites.feats.length > 0) {
            prerequisites.feats.forEach(feat => {
                formatted += `<li>${feat}</li>`;
            });
        }
        
        if (formatted === '<ul>') {
            return null; // No prerequisites
        }
        
        formatted += '</ul>';
        return formatted;
    }

    // Populate feats list
    populateFeats() {
        if (!this.currentCharacter) return;
        
        const featsList = document.getElementById('featsList');
        featsList.innerHTML = '';
        
        // Sort feats alphabetically by name
        const sortedFeats = this.sortItemsAlphabetically(this.currentCharacter.feats);
        
        sortedFeats.forEach(feat => {
            const featElement = document.createElement('div');
            featElement.className = 'feat-item';
            
            // Get feat data from database
            const databaseFeat = window.GAME_DATABASE.feats.find(f => f.name === feat.name);
            const tier = feat.tier || 1;
            const cost = feat.cost || 0;
            // Get effect from database
            let effect = 'No tier effect available.';
            let effectDescription = 'No effect description available.';
            let description = 'No description available.';
            let prerequisites = null;
            let baseEffectDescription = 'No base effect description.';
            
            if (databaseFeat) {
                description = databaseFeat.description || 'No description available.';
                baseEffectDescription = databaseFeat.baseEffectDescription || 'No base effect description.';
                effectDescription = databaseFeat.effectDescription || 'No effect description available.';
                // Use cumulative description instead of just current tier (without base effect since it's shown separately)
                const cumulativeDescription = this.getCumulativeFeatDescription(feat.name, tier, false);
                effect = cumulativeDescription || (databaseFeat.effects && databaseFeat.effects[tier] ? databaseFeat.effects[tier] : 'No tier effect available.');
                prerequisites = this.formatPrerequisites(databaseFeat.prerequisites);
            }

            

            
            featElement.innerHTML = `
                <div class="feat-info">
                    <div class="feat-overview">
                        <div class="feat-name">${feat.name}</div>
                        ${feat.tier ? `<div class="feat-tier">Tier ${this.getRomanNumeral(tier)}</div>` : ''}
                        ${feat.cost ? `<div class="feat-cost">Cost: ${cost}</div>` : ''}
                    </div>
                    <div class="feat-tier-edit editable-only">
                        <label for="feat-tier-${feat.id}">Tier:</label>
                        <select id="feat-tier-${feat.id}" class="feat-tier-dropdown" onchange="window.app.changeFeatTier('${feat.id}', this.value)">
                            ${this.generateFeatTierOptions(databaseFeat, feat.tier, cost)}
                        </select>
                    </div>
                    <div class="feat-description">${description}</div>
                    ${feat.customDetails ? `<div class="feat-custom-summary"><strong>Custom:</strong> ${feat.customDetails}</div>` : ''}
                    <div class="feat-details" style="display: none;">
                        ${prerequisites ? `<div class="feat-prerequisites"><h5>Prerequisites:</h5>${prerequisites}</div>` : ''}
                        ${baseEffectDescription ? `<div class="feat-base-effect-description"><h5>Base Effect Description:</h5><p>${baseEffectDescription}</p></div>` : ''}
                        ${(effectDescription && effectDescription !== 'No effect description available.') ? `<div class="feat-effect-description"><h5>Effect Description:</h5><p>${effectDescription}</p></div>` : ''}
                        ${effect && effect !== 'No tier effect available.' ? `<div class="feat-effect"><h5>Cumulative Effects:</h5><div class="cumulative-effects">${effect}</div></div>` : ''}
                        ${feat.customDetails ? `<div class="feat-custom-details"><h5>Custom Details:</h5><p>${feat.customDetails}</p></div>` : ''}
                    </div>
                </div>
                <div class="feat-actions">
                    <button class="remove-item" onclick="window.app.removeFeat('${feat.id}')">×</button>
                </div>
            `;
            
            // Add click event to expand/collapse feat details
            featElement.addEventListener('click', (e) => {
                // Prevent expansion if clicking on remove button
                if (e.target.classList.contains('remove-item')) {
                    return;
                }
                
                console.log('Feat clicked, toggling expanded state');
                
                // Toggle the expanded class
                const wasExpanded = featElement.classList.contains('expanded');
                featElement.classList.toggle('expanded');
                const isNowExpanded = featElement.classList.contains('expanded');
                
                // Find the details element
                const detailsElement = featElement.querySelector('.feat-details');
                if (detailsElement) {
                    if (isNowExpanded) {
                        detailsElement.style.display = 'block';
                        console.log('Feat expanded, details shown');
                    } else {
                        detailsElement.style.display = 'none';
                        console.log('Feat collapsed, details hidden');
                    }
                } else {
                    console.log('Details element not found');
                }
                
                // Log the state change
                
            });
            
            featsList.appendChild(featElement);
        });
    }

    // Change feat tier
    changeFeatTier(featId, newTier) {
        if (!this.currentCharacter) return;
        
        const feat = this.currentCharacter.feats.find(f => f.id === featId);
        if (!feat) return;
        
        const newTierInt = parseInt(newTier);
        if (isNaN(newTierInt) || newTierInt < 1) return;
        
        // Get feat data from database
        const databaseFeat = window.GAME_DATABASE.feats.find(f => f.name === feat.name);
        if (!databaseFeat) return;
        
        // Calculate cost changes
        const oldCost = feat.cost || 0;
        const newCost = databaseFeat.cost * newTierInt;
        const costDifference = newCost - oldCost;
        
        // Check if character has enough feat points
        const availableFeatPoints = 6 + this.currentCharacter.experiencePoints;
        const usedFeatPoints = this.currentCharacter.usedFeatPoints || 0;
        const availablePoints = availableFeatPoints - usedFeatPoints;
        
        if (costDifference > availablePoints) {
            this.showNotification('Not enough feat points available for this tier.', 'error');
            // Reset the dropdown to the current tier
            const dropdown = document.getElementById(`feat-tier-${featId}`);
            if (dropdown) {
                dropdown.value = feat.tier || 1;
            }
            return;
        }
        
        // Update the feat
        feat.tier = newTierInt;
        feat.cost = newCost;
        
        // Update feat points
        this.currentCharacter.usedFeatPoints = usedFeatPoints + costDifference;
        
        // Update displays
        this.populateFeats();
        this.updateFeatPointsDisplay();
        this.updateDefenseStats();
        this.updateMovementStats(); // Update movement stats in case Flying feat tier was changed
        this.populateFeatsDropdown(); // Refresh available feats dropdown
        this.populateAdvantages(); // Update advantages for feat-based advantages
        this.updateWeaponAdvantageDisplay(); // Update initiative advantages for Lightning Reflexes
        this.updateMaxHP(); // Update max HP in case Tough as Nails feat tier was changed
        this.populateEquipment(); // Update equipment display in case Two Weapon Brute feat tier was changed
        this.updateWealthDisplay(); // Update wealth display in case Wealthy feat tier was changed
        this.updateWellRoundedDescription(); // Update Well-Rounded description visibility
        this.updateAttributeSubstitutionDisplays(); // Update attribute substitution displays
        this.populateAvailableBoonsAndBanes(); // Refresh available boons/banes for Attribute Substitution
        
        // Refresh base actions to update feat notes
        if (this.hasFeatsAffectingBaseActions()) {
            this.populateBaseActions();
        }
        
        // Update feat icons
        this.updateFeatIcons();
        
        // Special handling for Alternate Form feat tier changes
        if (feat.name === 'Alternate Form') {
            
            this.handleAlternateFormTierChange(feat.tier);
        }
        
        // Special handling for Companion feat tier changes
        if (feat.name === 'Companion') {
            
            this.handleCompanionTierChange(feat.tier);
        }
        
        this.autoSave();
        
        this.showNotification(`Feat tier changed to ${this.getRomanNumeral(newTierInt)}`, 'success');
    }

    // Handle Alternate Form feat tier changes
    handleAlternateFormTierChange(newTier) {
        if (!this.currentCharacter) return;
        
        
        
        
        
        
        
        // Find all alternate forms of the current character
        const alternateForms = this.characters.filter(char => 
            char.isAlternateForm && char.primaryCharacterId === this.currentCharacter.id
        );
        
        console.log(`Found ${alternateForms.length} alternate forms:`, alternateForms.map(af => af.name));
        
        // Get current character's points before recalculation
        const currentCharacterMaxAttributePoints = this.getCurrentCharacterAvailableAttributePoints();
        const currentCharacterFeatPoints = this.getCurrentCharacterAvailableFeatPoints();
        
        
        // Recalculate each alternate form using the existing recalculation system
        alternateForms.forEach(alternateForm => {
            
            
            // Update the alternate form's tier to match the parent's Alternate Form feat tier
            if (newTier !== alternateForm.alternateFormTier) {
                
                alternateForm.alternateFormTier = newTier;
            }
            
            // Use the existing recalculation function to ensure consistency
            this.recalculateAlternateFormMaxPoints(alternateForm);
            
            // Update the available points to match max points
            alternateForm.availableAttributePoints = alternateForm.maxAttributePoints;
            alternateForm.availableFeatPoints = alternateForm.maxFeatPoints;
            
            
            
            // Debug: Show what the calculation should be
            if (alternateForm.alternateFormTier === 1) {
                const expectedAttr = Math.ceil(currentCharacterMaxAttributePoints / 2);
                
            } else if (alternateForm.alternateFormTier === 2) {
                const expectedAttr = currentCharacterMaxAttributePoints;
                
            }
        });
        
        // Save the updated characters
        this.saveCharacters();
        
        
        // Note: We don't need to update displays here because:
        // 1. If viewing the parent character, the display is already correct
        // 2. If viewing an alternate form, the user needs to switch to it to see updated values
        // The recalculation above ensures all alternate forms are updated in the data
        
        
    }

    // Transfer feat points from parent to Tier 3 companion
    transferFeatPointsToCompanion(companionId, pointsToTransfer) {
        if (!this.currentCharacter || this.currentCharacter.isCompanion) return false;
        
        const companion = this.characters.find(char => char.id === companionId);
        if (!companion || companion.companionTier !== 3) return false;
        
        const availableParentPoints = this.getCharacterAvailableFeatPoints(this.currentCharacter) - this.currentCharacter.usedFeatPoints;
        
        if (pointsToTransfer > availableParentPoints) {
            this.showNotification(`Not enough feat points available! You have ${availableParentPoints} available.`, 'error');
            return false;
        }
        
        // Transfer points
        if (!this.currentCharacter.featPointsSpentOnCompanions) {
            this.currentCharacter.featPointsSpentOnCompanions = 0;
        }
        if (!companion.featPointsFromParent) {
            companion.featPointsFromParent = 0;
        }
        
        this.currentCharacter.featPointsSpentOnCompanions += pointsToTransfer;
        companion.featPointsFromParent += pointsToTransfer;
        
        this.saveCharacters();
        this.updateFeatPointsDisplay();
        this.showNotification(`Transferred ${pointsToTransfer} feat points to ${companion.name}`, 'success');
        return true;
    }
    
    // Transfer feat points from Tier 3 companion back to parent
    transferFeatPointsFromCompanion(companionId, pointsToTransfer) {
        if (!this.currentCharacter || !this.currentCharacter.isCompanion || this.currentCharacter.companionTier !== 3) return false;
        
        const parent = this.characters.find(char => char.id === this.currentCharacter.parentCharacterId);
        if (!parent) return false;
        
        const availableCompanionPoints = this.currentCharacter.featPointsFromParent || 0;
        
        if (pointsToTransfer > availableCompanionPoints) {
            this.showNotification(`Not enough feat points to transfer back! Companion has ${availableCompanionPoints} points from parent.`, 'error');
            return false;
        }
        
        // Transfer points back
        if (!parent.featPointsSpentOnCompanions) {
            parent.featPointsSpentOnCompanions = 0;
        }
        
        parent.featPointsSpentOnCompanions -= pointsToTransfer;
        this.currentCharacter.featPointsFromParent -= pointsToTransfer;
        
        this.saveCharacters();
        this.updateFeatPointsDisplay();
        this.showNotification(`Transferred ${pointsToTransfer} feat points back to ${parent.name}`, 'success');
        return true;
    }

    // Handle Companion feat tier changes
    handleCompanionTierChange(newTier) {
        
        
        
        
        if (!this.currentCharacter) {
            console.log('No current character, returning');
            return;
        }
        
        // Find all companions of the current character
        const companions = this.characters.filter(char => 
            char.isCompanion && char.parentCharacterId === this.currentCharacter.id
        );
        
        console.log(`Found ${companions.length} companions:`, companions.map(comp => `${comp.name} (Tier ${comp.companionTier})`));
        
        // Get current character's level for calculations
        const currentCharacterLevel = this.currentCharacter.level;
        
        
        // Recalculate each companion using the companion calculation system
        companions.forEach(companion => {
            
            
            // Update the companion's tier to match the parent's Companion feat tier
            if (newTier !== companion.companionTier) {
                
                companion.companionTier = newTier;
            }
            
            // Recalculate companion points based on new tier and parent's level
            this.recalculateCompanionMaxPoints(companion, currentCharacterLevel);
            
            // Update the available points to match max points
            companion.availableAttributePoints = companion.maxAttributePoints;
            companion.availableFeatPoints = companion.maxFeatPoints;
            
            
            
            // Debug: Show what the calculation should be
            if (companion.companionTier === 1) {
                const expectedAttr = 20 + (currentCharacterLevel * 4);
                
            } else if (companion.companionTier === 2) {
                const expectedAttr = 20 + (currentCharacterLevel * 4);
                
            } else if (companion.companionTier === 3) {
                const expectedAttr = 30 + (currentCharacterLevel * 6);
                
            }
        });
        
        // Save the updated characters
        this.saveCharacters();
        
        
        // Update displays if we're currently viewing a companion
        if (this.currentCharacter.isCompanion) {
            this.updateAttributeDisplays();
            this.updateFeatPointsDisplay();
        }
        
        
    }

    // Remove feat
    removeFeat(featId) {
        if (!this.currentCharacter) return;
        
        // Ensure usedFeatPoints is initialized
        if (this.currentCharacter.usedFeatPoints === undefined) {
            this.currentCharacter.usedFeatPoints = 0;
        }
        
        const feat = this.currentCharacter.feats.find(f => f.id === featId);
        if (feat) {
            // Refund feat points if the feat has a cost
            if (feat.cost) {
                this.currentCharacter.usedFeatPoints -= feat.cost;
                
                // Update parent's own used feat points if this is a parent character with companions
                if (this.currentCharacter.companions && this.currentCharacter.companions.length > 0) {
                    if (!this.currentCharacter.ownUsedFeatPoints) {
                        this.currentCharacter.ownUsedFeatPoints = 0;
                    }
                    this.currentCharacter.ownUsedFeatPoints -= feat.cost;
                }
                
                // Handle Tier 3 companion feat point borrowing from parent (when removing feats)
                if (this.currentCharacter.isCompanion && this.currentCharacter.companionTier === 3) {
                    const companionOwnPoints = this.currentCharacter.maxFeatPoints;
                    const currentUsedPoints = this.currentCharacter.usedFeatPoints;
                    
                    if (currentUsedPoints < companionOwnPoints) {
                        // Companion is now using fewer points than their own, return borrowed points to parent
                        const parent = this.characters.find(char => char.id === this.currentCharacter.parentCharacterId);
                        if (parent && this.currentCharacter.featPointsFromParent > 0) {
                            const pointsToReturn = this.currentCharacter.featPointsFromParent;
                            parent.usedFeatPoints -= pointsToReturn;
                            this.currentCharacter.featPointsFromParent = 0;
                            
                        }
                    } else if (currentUsedPoints > companionOwnPoints) {
                        // Companion is still borrowing, but less than before
                        const pointsFromParent = currentUsedPoints - companionOwnPoints;
                        const parent = this.characters.find(char => char.id === this.currentCharacter.parentCharacterId);
                        if (parent) {
                            const previousPointsFromParent = this.currentCharacter.featPointsFromParent;
                            const pointsToReturn = previousPointsFromParent - pointsFromParent;
                            parent.usedFeatPoints -= pointsToReturn;
                            this.currentCharacter.featPointsFromParent = pointsFromParent;
                            
                        }
                    }
                }
            }
            this.currentCharacter.feats = this.currentCharacter.feats.filter(f => f.id !== featId);
            
            // Check if Two Weapon Brute feat was removed and handle weapon restrictions
            if (feat.name === 'Two Weapon Brute') {
                const equippedWeapons = this.currentCharacter.equipment.filter(e => e.equipped && e.type === 'weapon');
                const twoHandedWeapons = equippedWeapons.filter(weapon => weapon.properties && weapon.properties.includes('two-handed'));
                
                // If character has multiple two-handed weapons equipped, unequip all but the first one
                if (twoHandedWeapons.length > 1) {
                    for (let i = 1; i < twoHandedWeapons.length; i++) {
                        twoHandedWeapons[i].equipped = false;
                        this.showNotification(`Unequipped ${twoHandedWeapons[i].name} - Two Weapon Brute feat removed`, 'info');
                    }
                }
                
                // If character has a two-handed weapon and another weapon equipped, unequip the other weapon
                if (twoHandedWeapons.length > 0 && equippedWeapons.length > 1) {
                    const otherWeapons = equippedWeapons.filter(weapon => !weapon.properties || !weapon.properties.includes('two-handed'));
                    otherWeapons.forEach(weapon => {
                        weapon.equipped = false;
                        this.showNotification(`Unequipped ${weapon.name} - Two Weapon Brute feat removed`, 'info');
                    });
                }
            }
            
            this.populateFeats();
            this.updateFeatPointsDisplay();
            this.updateDefenseStats();
            this.updateMovementStats(); // Update movement stats in case Flying feat was removed
            this.populateFeatsDropdown(); // Refresh available feats dropdown
            this.populateAdvantages(); // Update advantages for feat-based advantages
            this.updateWeaponAdvantageDisplay(); // Update initiative advantages for Lightning Reflexes
            this.updateMaxHP(); // Update max HP in case Tough as Nails feat was removed
            this.populateEquipment(); // Update equipment display in case Two Weapon Brute feat was removed
            this.updateWealthDisplay(); // Update wealth display in case Wealthy feat was removed
            this.updateWellRoundedDescription(); // Update Well-Rounded description visibility
            this.updateAttributeSubstitutionDisplays(); // Update attribute substitution displays
            this.populateAvailableBoonsAndBanes(); // Refresh available boons/banes for Attribute Substitution
            
            // Refresh base actions to update feat notes
            if (this.hasFeatsAffectingBaseActions()) {
                this.populateBaseActions();
            }
            
            // Update feat icons
            this.updateFeatIcons();
            
            this.autoSave();
            this.showNotification('Feat removed.', 'success');
        }
    }

    // Generate tier options for feat dropdown
    generateFeatTierOptions(databaseFeat, currentTier, currentCost) {
        if (!databaseFeat || !this.currentCharacter) return '';
        
        const availableFeatPoints = 6 + this.currentCharacter.experiencePoints;
        const usedFeatPoints = this.currentCharacter.usedFeatPoints || 0;
        const currentFeatCost = currentCost || 0;
        const availablePoints = availableFeatPoints - usedFeatPoints + currentFeatCost;
        
        let options = '';
        for (let tier = 1; tier <= databaseFeat.tiers; tier++) {
            const tierCost = databaseFeat.cost * tier;
            const isAvailable = tierCost <= availablePoints;
            const isCurrent = tier === currentTier;
            
            if (isAvailable || isCurrent) {
                options += `<option value="${tier}" ${isCurrent ? 'selected' : ''}>Tier ${this.getRomanNumeral(tier)} (Cost: ${tierCost})</option>`;
            }
        }
        
        return options;
    }

    // Update feat points display
    updateFeatPointsDisplay() {
        if (!this.currentCharacter) return;
        
        // Ensure usedFeatPoints is initialized
        if (this.currentCharacter.usedFeatPoints === undefined) {
            this.currentCharacter.usedFeatPoints = 0;
        }
        
        // Calculate available feat points (respect alternate form and companion limitations)
        let availablePoints;
        if (this.currentCharacter.isAlternateForm && this.currentCharacter.maxFeatPoints !== undefined) {
            // Alternate form: use the pre-calculated maximum
            availablePoints = this.currentCharacter.maxFeatPoints;
        } else if (this.currentCharacter.isCompanion && this.currentCharacter.maxFeatPoints !== undefined) {
            // Companion: use the pre-calculated maximum (based on tier)
            // For Tier 3 companions, add available parent feat points
            if (this.currentCharacter.companionTier === 3) {
                const parent = this.characters.find(char => char.id === this.currentCharacter.parentCharacterId);
                if (parent) {
                    const parentBasePoints = 6 + parent.experiencePoints;
                    const parentOwnUsedPoints = parent.ownUsedFeatPoints || 0;
                    const parentAvailableForCompanion = parentBasePoints - parentOwnUsedPoints;
                    const companionOwnPoints = this.currentCharacter.maxFeatPoints;
                    // Companion can use their own points + parent's available points (total - parent's own used)
                    availablePoints = companionOwnPoints + Math.max(0, parentAvailableForCompanion);
                    
                } else {
                    availablePoints = this.currentCharacter.maxFeatPoints;
                }
            } else {
                availablePoints = this.currentCharacter.maxFeatPoints;
            }
        } else {
            // Primary form: normal calculation
            availablePoints = 6 + this.currentCharacter.experiencePoints;
            if (this.currentCharacter.featPointsSpentOnCompanions > 0) {
                
            }
        }
        const usedPoints = this.currentCharacter.usedFeatPoints;
        const remainingPoints = availablePoints - usedPoints;
        
        document.getElementById('availableFeatPoints').textContent = availablePoints;
        document.getElementById('usedFeatPoints').textContent = usedPoints;
        document.getElementById('remainingFeatPoints').textContent = remainingPoints;
        
        console.log('Feat points debug:', {
            availablePoints,
            usedFeatPoints: this.currentCharacter.usedFeatPoints,
            usedPoints,
            remainingPoints
        });
    }

    // Helper function to sort items alphabetically
    sortItemsAlphabetically(items, nameKey = 'name') {
        return items.sort((a, b) => {
            const nameA = a[nameKey] || '';
            const nameB = b[nameKey] || '';
            return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
        });
    }

    // Populate feats dropdown from database
    populateFeatsDropdown(sortBy = 'name') {
        if (!window.GAME_DATABASE || !window.GAME_DATABASE.feats) return;
        
        const featSelect = document.getElementById('featSelect');
        const tierSelect = document.getElementById('featTierSelect');
        
        // Clear existing options
        featSelect.innerHTML = '<option value="">Choose a feat...</option>';
        tierSelect.innerHTML = '<option value="">Choose tier...</option>';
        
        // Filter available feats first
        const availableFeats = window.GAME_DATABASE.feats.filter(feat => this.isFeatAvailable(feat));
        
        // Sort feats based on the sortBy parameter
        let sortedFeats;
        if (sortBy === 'cost') {
            sortedFeats = availableFeats.sort((a, b) => {
                if (a.cost !== b.cost) {
                    return a.cost - b.cost; // Sort by cost ascending
                }
                return a.name.localeCompare(b.name); // Then by name
            });
        } else {
            sortedFeats = this.sortItemsAlphabetically(availableFeats);
        }
        
        sortedFeats.forEach(feat => {
            const option = document.createElement('option');
            option.value = feat.name;
            option.textContent = `[${feat.cost}] ${feat.name}`;
            featSelect.appendChild(option);
        });
        
        // Add event listener for feat selection
        featSelect.addEventListener('change', () => this.onFeatSelectionChange());
    }

    // Check if a feat is available for the current character
    isFeatAvailable(feat) {
        if (!this.currentCharacter) return false;
        
        const canTakeMultiple = this.canTakeFeatMultipleTimes(feat);
        
        // Check if character already has this feat
        const existingFeat = this.currentCharacter.feats && this.currentCharacter.feats.find(f => f.name === feat.name);
        if (existingFeat) {
            // If feat can be taken multiple times, it's always available
            if (canTakeMultiple) {
                return this.meetsFeatRequirements(feat, 1);
            }
            
            // If feat cannot be taken multiple times, check if they can take another tier
            if (existingFeat.tier < feat.tiers) {
                // Can take higher tier, but need to check requirements for that specific tier
                return this.meetsFeatRequirements(feat, existingFeat.tier + 1);
            }
            return false; // Already at max tier
        }
        
        // Check if character can take the first tier
        return this.meetsFeatRequirements(feat, 1);
    }

    // Check if character meets requirements for a specific feat tier
    meetsFeatRequirements(feat, tier) {
        if (!this.currentCharacter || !feat.prerequisites || !feat.prerequisites[tier]) {
            return true; // No prerequisites means available
        }
        
        const prereq = feat.prerequisites[tier];
        
        // Check if this is an OR requirement between attributes and feats
        if (prereq.featRequirementLogic === "or" && prereq.attributes && prereq.feats) {
            // OR logic between attributes and feats - need EITHER attributes OR feats
            const requiredPowerLevel = prereq.powerLevel || 0;
            
            // Check if character has required attributes
            const hasRequiredAttributes = prereq.attributes.some(attr => {
                return this.getEffectiveAttributeScore(attr) >= requiredPowerLevel;
            });
            
            // Check if character has required feats
            const hasRequiredFeats = prereq.feats.some(requiredFeatName => {
                const { baseName, minTier } = this.parseFeatRequirement(requiredFeatName);
                
                return this.currentCharacter.feats && this.currentCharacter.feats.some(f => {
                    if (f.name === baseName) {
                        return f.tier >= minTier;
                    }
                    return false;
                });
            });
            
            // Return true if character has EITHER attributes OR feats
            return hasRequiredAttributes || hasRequiredFeats;
        }
        
        // Check attribute requirements (OR logic by default, AND logic if specified)
        if (prereq.attributes && prereq.attributes.length > 0) {
            const requiredPowerLevel = prereq.powerLevel || 0;
            const useAndLogic = prereq.attributeRequirementLogic === "and";
            
            if (useAndLogic) {
                // AND logic - need all of the required attributes
                const hasAllRequiredAttributes = prereq.attributes.every(attr => {
                    return this.getEffectiveAttributeScore(attr) >= requiredPowerLevel;
                });
                if (!hasAllRequiredAttributes) {
                    return false;
                }
            } else {
                // OR logic - need at least one of the required attributes (default behavior)
                const hasRequiredAttribute = prereq.attributes.some(attr => {
                    return this.getEffectiveAttributeScore(attr) >= requiredPowerLevel;
                });
                if (!hasRequiredAttribute) {
                    return false;
                }
            }
        }
        
        // Check feat requirements (AND logic by default, OR logic if specified)
        if (prereq.feats && prereq.feats.length > 0) {
            const useOrLogic = prereq.featRequirementLogic === "or";
            
            if (useOrLogic) {
                // OR logic - need at least one of the required feats
                const hasAnyRequiredFeat = prereq.feats.some(requiredFeatName => {
                    const { baseName, minTier } = this.parseFeatRequirement(requiredFeatName);
                    
                    return this.currentCharacter.feats && this.currentCharacter.feats.some(f => {
                        if (f.name === baseName) {
                            return f.tier >= minTier;
                        }
                        return false;
                    });
                });
                
                if (!hasAnyRequiredFeat) {
                    return false;
                }
            } else {
                // AND logic - need all of the required feats (default behavior)
                for (const requiredFeatName of prereq.feats) {
                    // Parse feat name and minimum tier requirement
                    const { baseName, minTier } = this.parseFeatRequirement(requiredFeatName);
                    
                    const hasRequiredFeat = this.currentCharacter.feats && this.currentCharacter.feats.some(f => {
                        if (f.name === baseName) {
                            return f.tier >= minTier;
                        }
                        return false;
                    });
                    
                    if (!hasRequiredFeat) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }

    // Parse feat requirement to extract base name and minimum tier
    parseFeatRequirement(featRequirement) {
        // Handle feats like "Defensive Reflexes II" where II indicates minimum tier 2
        const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
        
        for (let i = romanNumerals.length - 1; i >= 0; i--) {
            const numeral = romanNumerals[i];
            if (featRequirement.endsWith(` ${numeral}`)) {
                const baseName = featRequirement.substring(0, featRequirement.length - numeral.length - 1);
                return { baseName, minTier: i + 1 };
            }
        }
        
        // No tier requirement found
        return { baseName: featRequirement, minTier: 1 };
    }

    // Populate boons dropdown from database
    populateBoonsDropdown() {
        
        if (!window.GAME_DATABASE || !window.GAME_DATABASE.boons) {
            return;
        }
        
        // Get all boon dropdowns (there are duplicates in different sections)
        const boonSelects = document.querySelectorAll('#boonSelect');
        const powerLevelSelects = document.querySelectorAll('#boonPowerLevel');
        
        
        // Sort boons alphabetically
        const sortedBoons = this.sortItemsAlphabetically(window.GAME_DATABASE.boons);
        const sortedCustomBoons = this.customBoons ? this.sortItemsAlphabetically(this.customBoons) : [];
        
        // Populate all boon dropdowns
        boonSelects.forEach((boonSelect, index) => {
            if (boonSelect) {
                // Clear existing options
                boonSelect.innerHTML = '<option value="">Choose a boon...</option>';
                
                // Add official boons to dropdown
                sortedBoons.forEach(boon => {
                    const option = document.createElement('option');
                    option.value = boon.name;
                    option.textContent = boon.name;
                    boonSelect.appendChild(option);
                });
                
                // Add custom boons if any exist
                if (sortedCustomBoons.length > 0) {
                    const separator = document.createElement('option');
                    separator.disabled = true;
                    separator.textContent = '--- Custom Boons ---';
                    boonSelect.appendChild(separator);
                    
                    sortedCustomBoons.forEach(boon => {
                        const option = document.createElement('option');
                        option.value = boon.name;
                        option.textContent = `${boon.name} (Custom)`;
                        option.dataset.custom = 'true';
                        boonSelect.appendChild(option);
                    });
                }
                
            }
        });
        
        // Clear and reset power level dropdowns
        powerLevelSelects.forEach((powerLevelSelect, index) => {
            if (powerLevelSelect) {
                powerLevelSelect.innerHTML = '<option value="">Choose Power Level...</option>';
            }
        });
    }

    // Populate banes dropdown from database
    populateBanesDropdown() {
        
        if (!window.GAME_DATABASE || !window.GAME_DATABASE.banes) {
            return;
        }
        
        // Get all bane dropdowns (there are duplicates in different sections)
        const baneSelects = document.querySelectorAll('#baneSelect');
        const powerLevelSelects = document.querySelectorAll('#banePowerLevel');
        
        
        // Sort banes alphabetically
        const sortedBanes = this.sortItemsAlphabetically(window.GAME_DATABASE.banes);
        const sortedCustomBanes = this.customBanes ? this.sortItemsAlphabetically(this.customBanes) : [];
        
        // Populate all bane dropdowns
        baneSelects.forEach((baneSelect, index) => {
            if (baneSelect) {
                // Clear existing options
                baneSelect.innerHTML = '<option value="">Choose a bane...</option>';
                
                // Add official banes to dropdown
                sortedBanes.forEach(bane => {
                    const option = document.createElement('option');
                    option.value = bane.name;
                    option.textContent = bane.name;
                    baneSelect.appendChild(option);
                });
                
                // Add custom banes if any exist
                if (sortedCustomBanes.length > 0) {
                    const separator = document.createElement('option');
                    separator.disabled = true;
                    separator.textContent = '--- Custom Banes ---';
                    baneSelect.appendChild(separator);
                    
                    sortedCustomBanes.forEach(bane => {
                        const option = document.createElement('option');
                        option.value = bane.name;
                        option.textContent = `${bane.name} (Custom)`;
                        option.dataset.custom = 'true';
                        baneSelect.appendChild(option);
                    });
                }
                
            }
        });
        
        // Clear and reset power level dropdowns
        powerLevelSelects.forEach((powerLevelSelect, index) => {
            if (powerLevelSelect) {
                powerLevelSelect.innerHTML = '<option value="">Choose Power Level...</option>';
            }
        });
    }

    // Manually trigger dropdown population (useful for debugging or when switching modes)
    populateAllDropdowns() {
        this.populateFeatsDropdown();
        this.populateBoonsDropdown();
        this.populateBanesDropdown();
        this.populatePerksDropdown();
        this.populateFlawsDropdown();
        this.populateWeaponBanesDropdowns();
    }

    // Populate perks dropdown from database
    populatePerksDropdown() {
        if (!window.GAME_DATABASE || !window.GAME_DATABASE.perks) return;
        
        const perkSelect = document.getElementById('perkSelect');
        
        // Clear existing options
        perkSelect.innerHTML = '<option value="">Choose a perk...</option>';
        
        // Sort perks alphabetically and add to dropdown
        const sortedPerks = this.sortItemsAlphabetically(window.GAME_DATABASE.perks);
        sortedPerks.forEach(perk => {
            const option = document.createElement('option');
            option.value = perk.name;
            option.textContent = perk.name;
            perkSelect.appendChild(option);
        });
    }

    // Populate flaws dropdown from database
    populateFlawsDropdown() {
        if (!window.GAME_DATABASE || !window.GAME_DATABASE.flaws) return;
        
        const flawSelect = document.getElementById('flawSelect');
        
        // Clear existing options
        flawSelect.innerHTML = '<option value="">Choose a flaw...</option>';
        
        // Sort flaws alphabetically and add to dropdown
        const sortedFlaws = this.sortItemsAlphabetically(window.GAME_DATABASE.flaws);
        sortedFlaws.forEach(flaw => {
            const option = document.createElement('option');
            option.value = flaw.name;
            option.textContent = flaw.name;
            flawSelect.appendChild(option);
        });
    }

    // Handle feat selection change
    onFeatSelectionChange() {
        const featSelect = document.getElementById('featSelect');
        const tierSelect = document.getElementById('featTierSelect');
        const costDisplay = document.getElementById('featCostDisplay');
        const addButton = document.getElementById('addFeatBtn');
        const previewDiv = document.getElementById('featPreview');
        const customInputDiv = document.getElementById('featCustomInput');
        
        const selectedFeatName = featSelect.value;
        if (!selectedFeatName) {
            tierSelect.innerHTML = '<option value="">Choose tier...</option>';
            costDisplay.textContent = '0';
            addButton.disabled = true;
            previewDiv.style.display = 'none';
            customInputDiv.style.display = 'none';
            customInputDiv.innerHTML = ''; // Clear custom input content
            return;
        }
        
        const feat = window.GAME_DATABASE.feats.find(f => f.name === selectedFeatName);
        if (!feat) return;
        
        // Clear previous custom input content before showing new feat
        customInputDiv.innerHTML = '';
        customInputDiv.style.display = 'none';
        
        // Show preview
        this.showFeatPreview(feat);
        
        // Check if this feat should hide the custom input field
        const featsWithoutCustomInput = [
            'Area Manipulation', 'Armor Mastery', 'Attack Redirection', 'Battle Trance',
            'Battlefield Opportunist', 'Battlefield Retribution', 'Breakfall', 'Brutal Intimidation',
            'Climbing', 'Combat Follow-through', 'Combat Momentum', 'Craft Extraordinary Item',
            'Crushing Blow', 'Death Blow', 'Deathless Trance', 'Defensive Mastery',
            'Defensive Reflexes', 'Destructive Trance', 'Diehard', 'Evasive Footwork',
            'Extraordinary Defense', 'Extraordinary Healing', 'Fast Draw', 'Fast Tracker',
            'Ferocious Minions', 'Fleet of Foot', 'Flying', 'Great Leap', 'Hallucination',
            'Heightened Invocation', 'Hospitaler', 'Impervious Trance', 'Indomitable Endurance',
            'Indomitable Resolve', 'Inspiring Champion', 'Lethal Strike', 'Lightning Reflexes',
            'Silencing Strike', 'Master Tracker', 'Mimic', 'Multi-Attack Specialist',
            'Multi-Target Boon Expert', 'Multi-Target Boon Specialist', 'Natural Defense',
            'Overpowering Strike', 'Reactionary Trance', 'Reckless Attack', 'Resilient',
            'Sentinel', 'Superior Concentration', 'Swimming', 'Tough as Nails',
            'Two Weapon Brute', 'Two Weapon Defense', 'Unending Charm', 'Untrackable',
            'Vicious Strike', 'Wealthy', 'Well-Rounded'
        ];
        
        const shouldHideCustomInput = featsWithoutCustomInput.some(featName => 
            feat.name.startsWith(featName)
        );
        
        // Special handling for Attribute Substitution feat
        if (feat.name === 'Attribute Substitution') {
            this.showAttributeSubstitutionDropdowns();
        } else if (feat.name === 'Bane Focus') {
            this.showBaneFocusDropdown();
        } else if (feat.name === 'Battlefield Punisher') {
            this.showBattlefieldPunisherDropdown();
        } else if (feat.name === 'Boon Access') {
            this.showBoonAccessDropdown();
        } else if (feat.name === 'Boon Focus') {
            this.showBoonFocusDropdown();
        } else if (feat.name === 'Extraordinary Focus') {
            this.showExtraordinaryFocusDropdown();
        } else if (feat.name === 'Multi-Bane Specialist') {
            this.showMultiBaneSpecialistDropdown();
        } else if (feat.name === 'Potent Bane') {
            this.showPotentBaneDropdown();
        } else if (feat.name === 'Skill Specialization') {
            this.showSkillSpecializationDropdown();
        } else if (feat.name === 'Alternate Form') {
            this.showAlternateFormCustomInput();
        } else if (feat.name === 'Companion') {
            this.showCompanionCustomInput();
        } else if (shouldHideCustomInput) {
            // Hide custom input for these feats
            customInputDiv.style.display = 'none';
        } else {
            // Show custom input field for other feats
            customInputDiv.style.display = 'block';
            
            // Restore default textarea HTML if it was replaced by a dropdown
            let textarea = document.getElementById('featCustomInputField');
            if (!textarea) {
                customInputDiv.innerHTML = `
                    <label for="featCustomInputField">Optional Details:</label>
                    <textarea id="featCustomInputField" placeholder="Enter optional details for this feat..." class="editable-only"></textarea>
                `;
                textarea = document.getElementById('featCustomInputField');
            }
            
            // Update label and placeholder based on whether custom input is required
            const label = customInputDiv.querySelector('label');
            
            if (feat.customInput) {
                // This feat requires custom input
                if (label) label.textContent = feat.customInputLabel || 'Required Details:';
                if (textarea) {
                    textarea.placeholder = feat.customInputPlaceholder || 'Enter required details for this feat...';
                    textarea.value = ''; // Clear any previous value
                }
                if (label) label.style.color = '#dc3545'; // Red to indicate required
            } else {
                // This feat has optional custom input
                if (label) label.textContent = 'Optional Details:';
                if (textarea) {
                    textarea.placeholder = 'Enter optional details for this feat (e.g., notes, conditions, etc.)...';
                    textarea.value = ''; // Clear any previous value
                }
                if (label) label.style.color = '#6c757d'; // Gray to indicate optional
            }
        }
        
        // Populate tiers based on requirements
        tierSelect.innerHTML = '<option value="">Choose tier...</option>';
        
        // Check if character already has this feat
        const existingFeat = this.currentCharacter.feats && this.currentCharacter.feats.find(f => f.name === feat.name);
        const canTakeMultiple = this.canTakeFeatMultipleTimes(feat);
        
        // If feat cannot be taken multiple times and character already has it, don't show tiers
        if (!canTakeMultiple && existingFeat) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Feat already exists - edit existing feat instead';
            option.disabled = true;
            tierSelect.appendChild(option);
            return;
        }
        
        // Show tiers based on whether feat can be taken multiple times
        const startTier = canTakeMultiple ? 1 : (existingFeat ? existingFeat.tier + 1 : 1);
        
        for (let i = startTier; i <= feat.tiers; i++) {
            const meetsRequirements = this.meetsFeatRequirements(feat, i);
            const option = document.createElement('option');
            option.value = i.toString();
            option.textContent = `Tier ${this.getRomanNumeral(i)}`;
            
            // Disable option if requirements not met
            if (!meetsRequirements) {
                option.disabled = true;
                option.textContent += ' (Requirements not met)';
            }
            
            tierSelect.appendChild(option);
        }
        
        // If no tiers are available, show a message
        if (tierSelect.children.length === 1) { // Only the "Choose tier..." option
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No tiers available';
            option.disabled = true;
            tierSelect.appendChild(option);
        }
        
        // Auto-select tier if only one tier is available (excluding the default "Choose tier..." option)
        const availableTiers = Array.from(tierSelect.children).filter(option => 
            !option.disabled && option.value !== ''
        );
        
        if (availableTiers.length === 1) {
            const singleTier = availableTiers[0];
            tierSelect.value = singleTier.value;
            tierSelect.disabled = true;
            // Trigger the tier selection change to update cost and enable add button
            this.onTierSelectionChange();
        } else {
            tierSelect.disabled = false;
        }
        
        // Add event listener for tier selection
        tierSelect.addEventListener('change', () => this.onTierSelectionChange());
    }



    // Handle boon selection change
    onBoonSelectionChange() {
        const boonSelect = document.getElementById('boonSelect');
        const powerLevelSelect = document.getElementById('boonPowerLevel');
        const sustainCheckbox = document.getElementById('sustainCheckbox');
        const attributeSelect = document.getElementById('boonAttribute');
        const resistanceTypeInput = document.getElementById('boonResistanceType');
        
        const selectedBoonName = boonSelect.value;
        if (!selectedBoonName) {
            powerLevelSelect.innerHTML = '<option value="">Choose Power Level...</option>';
            sustainCheckbox.style.display = 'none';
            attributeSelect.style.display = 'none';
            resistanceTypeInput.style.display = 'none';
            return;
        }
        
        // Check both official and custom boons
        let boon = window.GAME_DATABASE.boons.find(b => b.name === selectedBoonName);
        if (!boon && this.customBoons) {
            boon = this.customBoons.find(b => b.name === selectedBoonName);
        }
        if (!boon) return;
        
        // Populate power levels
        powerLevelSelect.innerHTML = '<option value="">Choose Power Level...</option>';
        boon.powerLevels.forEach(level => {
            const option = document.createElement('option');
            option.value = level.toString();
            option.textContent = `PL ${level}`;
            powerLevelSelect.appendChild(option);
        });
        
        // Show attribute dropdown only for Bolster boon
        if (selectedBoonName === 'Bolster') {
            attributeSelect.style.display = 'block';
            resistanceTypeInput.style.display = 'none';
        } else {
            attributeSelect.style.display = 'none';
        }
        
        // Show resistance type input only for Resistance boon
        if (selectedBoonName === 'Resistance') {
            resistanceTypeInput.style.display = 'block';
        } else {
            resistanceTypeInput.style.display = 'none';
        }
        
        // Show sustain checkbox for all boons (since they can be sustained)
        sustainCheckbox.style.display = 'block';
    }

    // Handle bane selection change
    onBaneSelectionChange() {
        const baneSelect = document.getElementById('baneSelect');
        const powerLevelSelect = document.getElementById('banePowerLevel');
        
        const selectedBaneName = baneSelect.value;
        if (!selectedBaneName) {
            powerLevelSelect.innerHTML = '<option value="">Choose Power Level...</option>';
            return;
        }
        
        // Check both official and custom banes
        let bane = window.GAME_DATABASE.banes.find(b => b.name === selectedBaneName);
        if (!bane && this.customBanes) {
            bane = this.customBanes.find(b => b.name === selectedBaneName);
        }
        if (!bane) return;
        
        // Populate power levels
        powerLevelSelect.innerHTML = '<option value="">Choose Power Level...</option>';
        bane.powerLevels.forEach(level => {
            const option = document.createElement('option');
            option.value = level.toString();
            option.textContent = `PL ${level}`;
            powerLevelSelect.appendChild(option);
        });
    }

    // Handle tier selection change
    onTierSelectionChange() {
        const featSelect = document.getElementById('featSelect');
        const tierSelect = document.getElementById('featTierSelect');
        const costDisplay = document.getElementById('featCostDisplay');
        const addButton = document.getElementById('addFeatBtn');
        
        const selectedFeatName = featSelect.value;
        const selectedTier = parseInt(tierSelect.value) || 0;
        
        if (!selectedFeatName || !selectedTier) {
            costDisplay.textContent = '0';
            addButton.disabled = true;
            return;
        }
        
        const feat = window.GAME_DATABASE.feats.find(f => f.name === selectedFeatName);
        if (!feat) return;
        
        // Skip validation if in manual mode
        if (this.currentCharacter && this.currentCharacter.manualSettings) {
            const cost = feat.cost * selectedTier;
            costDisplay.textContent = cost;
            addButton.disabled = false;
            return;
        }
        
        // Check if the selected tier meets requirements
        if (!this.meetsFeatRequirements(feat, selectedTier)) {
            costDisplay.textContent = '0';
            addButton.disabled = true;
            return;
        }
        
        const cost = feat.cost * selectedTier;
        costDisplay.textContent = cost;
        
        // Check if character has enough feat points
        if (this.currentCharacter) {
            // Ensure usedFeatPoints is initialized
            if (this.currentCharacter.usedFeatPoints === undefined) {
                this.currentCharacter.usedFeatPoints = 0;
            }
            
            const availableFeatPoints = 6 + this.currentCharacter.experiencePoints;
            const remainingPoints = availableFeatPoints - this.currentCharacter.usedFeatPoints;
            
            if (cost <= remainingPoints) {
                addButton.disabled = false;
            } else {
                addButton.disabled = true;
            }
        } else {
            addButton.disabled = true;
        }
    }

    // Show feat preview
    showFeatPreview(feat) {
        const previewDiv = document.getElementById('featPreview');
        
        let effectsHtml = '';
        if (feat.effects && Object.keys(feat.effects).length > 0) {
            effectsHtml = '<div class="feat-effects"><h5>Effects by Tier:</h5><ul>';
            Object.entries(feat.effects).forEach(([tier, effect]) => {
                effectsHtml += `<li><strong>Tier ${this.getRomanNumeral(tier)}:</strong> ${effect}</li>`;
            });
            effectsHtml += '</ul></div>';
        }
        
        let specialHtml = '';
        if (feat.specialText) {
            specialHtml = `<div class="feat-special"><strong>Special:</strong> ${feat.specialText}</div>`;
        }
        
        // Build requirements HTML if prerequisites exist
        let requirementsHtml = '';
        if (feat.prerequisites && Object.keys(feat.prerequisites).length > 0) {
            requirementsHtml = '<div class="feat-requirements"><h5>Requirements:</h5><ul>';
            Object.entries(feat.prerequisites).forEach(([tier, prereq]) => {
                let tierRequirements = [];
                
                // Add attribute requirements
                if (prereq.attributes && prereq.attributes.length > 0) {
                    const powerLevel = prereq.powerLevel || '?';
                    const attrReqs = prereq.attributes.map(attr => 
                        attr.charAt(0).toUpperCase() + attr.slice(1)
                    );
                    tierRequirements.push(`${attrReqs.join(', ')} [${powerLevel}]`);
                }
                
                // Add feat requirements
                if (prereq.feats && prereq.feats.length > 0) {
                    tierRequirements.push(`Feats: ${prereq.feats.join(', ')}`);
                }
                
                if (tierRequirements.length > 0) {
                    requirementsHtml += `<li><strong>Tier ${this.getRomanNumeral(tier)}:</strong> ${tierRequirements.join('; ')}</li>`;
                }
            });
            requirementsHtml += '</ul></div>';
        }
        
        previewDiv.innerHTML = `
            <h4>${feat.name}</h4>
            <div class="feat-description">${feat.description}</div>
            ${feat.baseEffectDescription ? `<div class="feat-description"><strong>Base Effect:</strong> ${feat.baseEffectDescription}</div>` : ''}
            ${feat.effectDescription ? `<div class="feat-description"><strong>Effect:</strong> ${feat.effectDescription}</div>` : ''}
            ${requirementsHtml}
            ${effectsHtml}
            ${specialHtml}
        `;
        
        previewDiv.style.display = 'block';
    }
    
    // Convert number to Roman numeral
    getRomanNumeral(num) {
        const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
        return romanNumerals[num - 1] || num.toString();
    }
    
    // Handle perk selection change
    onPerkSelectionChange() {
        const perkSelect = document.getElementById('perkSelect');
        const selectedPerkName = perkSelect.value;
        
        if (!selectedPerkName) {
            document.getElementById('perkPreview').style.display = 'none';
            return;
        }
        
        const perk = window.GAME_DATABASE.perks.find(p => p.name === selectedPerkName);
        if (!perk) return;
        
        this.showPerkPreview(perk);
    }
    
    // Handle flaw selection change
    onFlawSelectionChange() {
        const flawSelect = document.getElementById('flawSelect');
        const selectedFlawName = flawSelect.value;
        
        if (!selectedFlawName) {
            document.getElementById('flawPreview').style.display = 'none';
            return;
        }
        
        const flaw = window.GAME_DATABASE.flaws.find(f => f.name === selectedFlawName);
        if (!flaw) return;
        
        this.showFlawPreview(flaw);
    }
    
    // Show perk preview
    showPerkPreview(perk) {
        const previewDiv = document.getElementById('perkPreview');
        
        previewDiv.innerHTML = `
            <h4>${perk.name}</h4>
            <div class="perk-description">${perk.description}</div>
            ${perk.effect ? `<div class="perk-effect"><h5>Effect:</h5><p>${perk.effect}</p></div>` : ''}
            ${perk.effectDescription ? `<div class="perk-effect"><h5>Additional Effect:</h5><p>${perk.effectDescription}</p></div>` : ''}
        `;
        
        previewDiv.style.display = 'block';
    }
    
    // Show flaw preview
    showFlawPreview(flaw) {
        const previewDiv = document.getElementById('flawPreview');
        
        previewDiv.innerHTML = `
            <h4>${flaw.name}</h4>
            <div class="flaw-description">${flaw.description}</div>
            ${flaw.effectDescription ? `<div class="flaw-effect"><h5>Effect:</h5><p>${flaw.effectDescription}</p></div>` : ''}
        `;
        
        previewDiv.style.display = 'block';
    }

    // Add advantage
    addAdvantage() {
        if (!this.currentCharacter) return;
        
        const input = document.getElementById('newAdvantage');
        const attributeSelect = document.getElementById('advantageAttribute');
        const countSelect = document.getElementById('advantageCountSelect');
        const advantageName = input.value.trim();
        const attribute = attributeSelect.value;
        const count = parseInt(countSelect.value) || 1;
        
        if (!advantageName) {
            this.showNotification('Please enter an advantage name.', 'error');
            return;
        }
        
        if (!this.currentCharacter.advantages.some(a => a.name === advantageName)) {
            const advantage = {
                name: advantageName,
                attribute: attribute,
                count: count
            };
            this.currentCharacter.advantages.push(advantage);
            this.populateAdvantages();
            this.updateAdvantageDisadvantageCalculation();
            this.autoSave();
            input.value = '';
            this.showNotification(`Added advantage: ${advantageName} (${attribute}) x${count}`, 'success');
        } else {
            this.showNotification('This advantage already exists.', 'error');
        }
    }

    // Remove advantage
    removeAdvantage(advantageName) {
        if (!this.currentCharacter) return;
        
        this.currentCharacter.advantages = this.currentCharacter.advantages.filter(a => a.name !== advantageName);
        this.populateAdvantages();
        this.updateAdvantageDisadvantageCalculation();
        this.autoSave();
    }

    // Add disadvantage
    addDisadvantage() {
        if (!this.currentCharacter) return;
        
        const input = document.getElementById('newDisadvantage');
        const attributeSelect = document.getElementById('disadvantageAttribute');
        const countSelect = document.getElementById('disadvantageCountSelect');
        const disadvantageName = input.value.trim();
        const attribute = attributeSelect.value;
        const count = parseInt(countSelect.value) || 1;
        
        if (!disadvantageName) {
            this.showNotification('Please enter a disadvantage name.', 'error');
            return;
        }
        if (!this.currentCharacter.disadvantages.some(d => d.name === disadvantageName)) {
            const disadvantage = {
                name: disadvantageName,
                attribute: attribute || 'all attributes', // Default to "all attributes" if undefined
                count: count
            };
            this.currentCharacter.disadvantages.push(disadvantage);
            this.populateDisadvantages();
            this.updateAdvantageDisadvantageCalculation();
            this.autoSave();
            input.value = '';
            this.showNotification(`Added disadvantage: ${disadvantageName} (${attribute}) x${count}`, 'success');
        } else {
            this.showNotification('This disadvantage already exists.', 'error');
        }
    }

    // Remove disadvantage
    removeDisadvantage(disadvantageName) {
        if (!this.currentCharacter) return;
        
        this.currentCharacter.disadvantages = this.currentCharacter.disadvantages.filter(d => d.name !== disadvantageName);
        this.populateDisadvantages();
        this.updateAdvantageDisadvantageCalculation();
        this.autoSave();
    }

    // Add boon
    addBoon() {
        if (!this.currentCharacter) return;
        
        const boonSelect = document.getElementById('boonSelect');
        const powerLevelSelect = document.getElementById('boonPowerLevel');
        const sustainingCheckbox = document.getElementById('boonSustaining');
        const attributeSelect = document.getElementById('boonAttribute');
        const resistanceTypeInput = document.getElementById('boonResistanceType');
        
        const boonName = boonSelect.value;
        const powerLevel = parseInt(powerLevelSelect.value) || 0;
        const selectedAttribute = attributeSelect.value;
        const resistanceType = resistanceTypeInput.value.trim();
        
        if (!boonName) {
            this.showNotification('Please select a boon.', 'error');
            return;
        }
        
        if (!powerLevel) {
            this.showNotification('Please select a power level.', 'error');
            return;
        }
        
        // Special validation for Bolster boon
        if (boonName === 'Bolster' && !selectedAttribute) {
            this.showNotification('Please select an attribute for Bolster.', 'error');
            return;
        }
        
        // Special validation for Resistance boon
        if (boonName === 'Resistance' && !resistanceType) {
            this.showNotification('Please enter a resistance type for Resistance.', 'error');
            return;
        }
        
        // Find boon in database or custom boons
        let foundBoon = window.GAME_DATABASE.boons.find(b => b.name === boonName);
        if (!foundBoon && this.customBoons) {
            foundBoon = this.customBoons.find(b => b.name === boonName);
        }
        if (!foundBoon) {
            this.showNotification('Selected boon not found in database or custom boons.', 'error');
            return;
        }
        
        // Remove any existing boon with the same name
        this.currentCharacter.boons = this.currentCharacter.boons.filter(b => b.name !== boonName);
        
        // Get duration from found boon (independent of power level)
        const duration = foundBoon.duration || 'Sustain';
        
        const boon = {
            name: boonName,
            duration: duration,
            powerLevel: powerLevel,
            sustaining: sustainingCheckbox.checked
        };
        
        // Add special properties for Bolster boon
        if (boonName === 'Bolster') {
            boon.bolsterAttribute = selectedAttribute;
        }
        
        // Add special properties for Resistance boon
        if (boonName === 'Resistance') {
            boon.resistanceType = resistanceType;
        }
        
        this.currentCharacter.boons.push(boon);
        
        // Handle special Bolster boon logic
        if (boonName === 'Bolster') {
            this.addBolsterAdvantage(boon);
        }
        
        // Handle special Haste boon logic
        if (boonName === 'Haste') {
            this.addHasteDisadvantages(boon);
        }
        
        // Handle special Concealment boon logic
        if (boonName === 'Concealment') {
            this.addConcealmentEffects(boon);
        }
        
        this.populateBoons();
        this.populateAdvantages(); // Refresh advantages display to show new Bolster advantage
        this.populateDisadvantages(); // Refresh disadvantages display to show new Haste disadvantages
        this.updateAdvantageDisadvantageCalculation();
        this.updateDefenseStats(); // Update defense stats in case Haste boon was added
        this.updateMovementStats(); // Update movement stats in case movement-affecting boons were added
        
        // Sync boons to related characters
        this.syncBoonsToRelatedCharacters();
        
        this.autoSave();
        
        // Reset form
        boonSelect.value = '';
        powerLevelSelect.innerHTML = '<option value="">Choose Power Level...</option>';
        sustainingCheckbox.checked = false;
        attributeSelect.style.display = 'none';
        resistanceTypeInput.style.display = 'none';
        resistanceTypeInput.value = '';
        
        this.showNotification(`Added boon: ${boonName} (${duration}, PL ${powerLevel})`, 'success');
    }

    // Add Bolster advantage
    addBolsterAdvantage(bolsterBoon) {
        if (!this.currentCharacter || !bolsterBoon.bolsterAttribute) return;
        
        // Calculate advantage value based on power level
        let advantageValue = 0;
        const powerLevel = parseInt(bolsterBoon.powerLevel);
        switch (powerLevel) {
            case 3:
                advantageValue = 1;
                break;
            case 6:
                advantageValue = 2;
                break;
            case 8:
                advantageValue = 3;
                break;
            default:
                advantageValue = 0;
        }
        
        if (advantageValue > 0) {
            // Create advantage name
            const attributeName = bolsterBoon.bolsterAttribute.charAt(0).toUpperCase() + bolsterBoon.bolsterAttribute.slice(1);
            const advantageName = `Bolster: ${attributeName}`;
            
            // Remove any existing Bolster advantages
            this.currentCharacter.advantages = this.currentCharacter.advantages.filter(adv => 
                !adv.name.startsWith('Bolster:')
            );
            
            // Add new Bolster advantage
            const newAdvantage = {
                name: advantageName,
                attribute: attributeName,
                count: advantageValue,
                source: 'Bolster Boon'
            };
            
            this.currentCharacter.advantages.push(newAdvantage);
        }
    }

    // Add Haste disadvantages
    addHasteDisadvantages(hasteBoon) {
        if (!this.currentCharacter || !hasteBoon.powerLevel) return;
        
        // Remove any existing Haste disadvantages first
        this.removeHasteDisadvantages();
        
        // Add disadvantages based on power level
        if (hasteBoon.powerLevel >= 6) {
            this.currentCharacter.disadvantages.push({
                name: 'Haste: Extra Major Action',
                attribute: 'all attributes',
                count: 3,
                source: 'Haste Boon'
            });
        }
        
        if (hasteBoon.powerLevel >= 8) {
            this.currentCharacter.disadvantages.push({
                name: 'Haste: Extra Major Action 2',
                attribute: 'all attributes',
                count: 3,
                source: 'Haste Boon'
            });
        }
    }

    // Add Concealment effects
    addConcealmentEffects(concealmentBoon) {
        if (!this.currentCharacter || !concealmentBoon.powerLevel) return;
        
        // Remove any existing Concealment effects first
        this.removeConcealmentEffects();
        
        // Calculate Guard bonus and Agility advantage based on power level
        let guardBonus = 0;
        let agilityAdvantage = 0;
        
        switch (concealmentBoon.powerLevel) {
            case 3:
            case 4:
                guardBonus = 1;
                agilityAdvantage = 1;
                break;
            case 5:
                guardBonus = 3;
                agilityAdvantage = 3;
                break;
            case 6:
            case 7:
            case 8:
                guardBonus = 5;
                agilityAdvantage = 5;
                break;
            default:
                return; // No effects for other power levels
        }
        
        // Add Agility advantage
        if (agilityAdvantage > 0) {
            this.currentCharacter.advantages.push({
                name: 'Concealment: Hiding',
                attribute: 'Agility',
                count: agilityAdvantage,
                source: 'Concealment Boon'
            });
        }
        
        // Store Guard bonus in the boon for the getBoonsBanesBonus function
        concealmentBoon.guardBonus = guardBonus;
    }

    // Remove Concealment effects
    removeConcealmentEffects() {
        if (!this.currentCharacter) return;
        
        // Remove Concealment advantage
        this.currentCharacter.advantages = this.currentCharacter.advantages.filter(adv => 
            !adv.name.startsWith('Concealment:')
        );
        
        // Remove Guard bonus from any Concealment boons
        if (this.currentCharacter.boons) {
            this.currentCharacter.boons.forEach(boon => {
                if (boon.name === 'Concealment') {
                    delete boon.guardBonus;
                }
            });
        }
    }

    // Remove Haste disadvantages
    removeHasteDisadvantages() {
        if (!this.currentCharacter) return;
        
        // Remove all Haste disadvantages
        this.currentCharacter.disadvantages = this.currentCharacter.disadvantages.filter(dis => 
            !dis.name.startsWith('Haste:')
        );
    }

    // Remove Bolster advantage
    removeBolsterAdvantage() {
        if (!this.currentCharacter) return;
        
        // Remove all Bolster advantages
        this.currentCharacter.advantages = this.currentCharacter.advantages.filter(adv => 
            !adv.name.startsWith('Bolster:')
        );
    }

    // Remove boon
    removeBoon(boonName) {
        if (!this.currentCharacter) return;
        
        // Handle special Bolster boon removal
        if (boonName === 'Bolster') {
            this.removeBolsterAdvantage();
        }
        
        // Handle special Haste boon removal
        if (boonName === 'Haste') {
            this.removeHasteDisadvantages();
        }
        
        // Handle special Concealment boon removal
        if (boonName === 'Concealment') {
            this.removeConcealmentEffects();
        }
        
        this.currentCharacter.boons = this.currentCharacter.boons.filter(b => b.name !== boonName);
        this.populateBoons();
        this.populateAdvantages(); // Refresh advantages display to remove Bolster advantage
        this.populateDisadvantages(); // Refresh disadvantages display to remove Haste disadvantages
        this.updateAdvantageDisadvantageCalculation();
        this.updateDefenseStats(); // Update defense stats in case Haste boon was removed
        this.updateMovementStats(); // Update movement stats in case movement-affecting boons were removed
        
        // Sync boons to related characters
        this.syncBoonsToRelatedCharacters();
        
        this.autoSave();
    }

    // Add bane
    addBane() {
        if (!this.currentCharacter) return;
        
        const baneSelect = document.getElementById('baneSelect');
        const powerLevelSelect = document.getElementById('banePowerLevel');
        
        const baneName = baneSelect.value;
        const powerLevel = parseInt(powerLevelSelect.value) || 0;
        
        if (!baneName) {
            this.showNotification('Please select a bane.', 'error');
            return;
        }
        
        if (!powerLevel) {
            this.showNotification('Please select a power level.', 'error');
            return;
        }
        
        // Find bane in database or custom banes
        let foundBane = window.GAME_DATABASE.banes.find(b => b.name === baneName);
        if (!foundBane && this.customBanes) {
            foundBane = this.customBanes.find(b => b.name === baneName);
        }
        if (!foundBane) {
            this.showNotification('Selected bane not found in database or custom banes.', 'error');
            return;
        }
        
        // Get duration from found bane (independent of power level)
        const duration = foundBane.duration || 'Sustain';
        
        const bane = {
            name: baneName,
            duration: duration,
            powerLevel: powerLevel,
            resists: [false, false, false]
        };
        
        this.currentCharacter.banes.push(bane);
        this.populateBanes();
        this.updateAdvantageDisadvantageCalculation();
        
        // Apply specific bane effects
        if (baneName === 'Blinded') {
            this.addBlindedEffects(bane);
        } else if (baneName === 'Deafened') {
            this.addDeafenedEffects(bane);
        } else if (baneName === 'Demoralized') {
            this.addDemoralizedEffects(bane);
        } else if (baneName === 'Fatigued') {
            this.addFatiguedEffects(bane);
        } else if (baneName === 'Immobile') {
            this.addImmobileEffects(bane);
        } else if (baneName === 'Incapacitated') {
            this.addIncapacitatedEffects(bane);
        } else if (baneName === 'Knockdown') {
            this.addKnockdownEffects(bane);
        } else if (baneName === 'Provoked') {
            this.addProvokedEffects(bane);
        } else if (baneName === 'Sickened') {
            this.addSickenedEffects(bane);
        } else if (baneName === 'Stupefied') {
            this.addStupefiedEffects(bane);
        }
        
        // Update defense stats and advantages/disadvantages display
        this.updateDefenseStats();
        this.updateMovementStats(); // Update movement stats in case movement-affecting banes were added
        this.populateAdvantages();
        this.populateDisadvantages();
        
        // Sync banes to related characters
        this.syncBanesToRelatedCharacters();
        
        this.autoSave();
        
        // Reset form
        baneSelect.value = '';
        powerLevelSelect.innerHTML = '<option value="">Choose Power Level...</option>';
        
        this.showNotification(`Added bane: ${baneName} (${duration}, PL ${powerLevel})`, 'success');
    }

    // Remove bane
    removeBane(baneName) {
        if (!this.currentCharacter) return;
        
        // Find all banes with this name
        const banesWithName = this.currentCharacter.banes.filter(b => b.name === baneName);
        
        if (banesWithName.length === 0) {
            this.showNotification(`No bane found with name: ${baneName}`, 'error');
            return;
        }
        
        // If there's only one bane with this name, remove it directly
        if (banesWithName.length === 1) {
            const bane = banesWithName[0];
            
            // Check if it's a cursed bane that can't be removed
            if (bane.removable === false) {
                this.showNotification('Cannot remove cursed bane while item is equipped!', 'error');
                return;
            }
            
            // For cursed banes, also check if the source equipment still exists
            if (bane.isCursed && bane.equipmentId) {
                const sourceEquipment = this.currentCharacter.equipment.find(e => e.id === bane.equipmentId);
                if (sourceEquipment && sourceEquipment.equipped) {
                    this.showNotification('Cannot remove cursed bane while source item is equipped!', 'error');
                    return;
                }
            }
            
            // Remove the single bane
            this.currentCharacter.banes = this.currentCharacter.banes.filter(b => b.name !== baneName);
        } else {
            // Multiple banes with same name - find the non-cursed one to remove
            const nonCursedBane = banesWithName.find(b => !b.isCursed);
            
            if (nonCursedBane) {
                // Remove the non-cursed bane
                this.currentCharacter.banes = this.currentCharacter.banes.filter(b => b.id !== nonCursedBane.id);
                // Removed non-cursed bane
            } else {
                // All banes with this name are cursed - show error
                this.showNotification('Cannot remove cursed bane while item is equipped!', 'error');
                return;
            }
        }
        
        this.populateBanes();
        this.updateAdvantageDisadvantageCalculation();
        
        // Remove specific bane effects
        if (baneName === 'Blinded') {
            this.removeBlindedEffects();
        } else if (baneName === 'Deafened') {
            this.removeDeafenedEffects();
        } else if (baneName === 'Demoralized') {
            this.removeDemoralizedEffects();
        } else if (baneName === 'Fatigued') {
            this.removeFatiguedEffects();
        } else if (baneName === 'Immobile') {
            this.removeImmobileEffects();
        } else if (baneName === 'Incapacitated') {
            this.removeIncapacitatedEffects();
        } else if (baneName === 'Knockdown') {
            this.removeKnockdownEffects();
        } else if (baneName === 'Provoked') {
            this.removeProvokedEffects();
        } else if (baneName === 'Sickened') {
            this.removeSickenedEffects();
        } else if (baneName === 'Stupefied') {
            this.removeStupefiedEffects();
        }
        
        // Update defense stats and advantages/disadvantages display
        this.updateDefenseStats();
        this.updateMovementStats(); // Update movement stats in case movement-affecting banes were removed
        this.populateAdvantages();
        this.populateDisadvantages();
        
        // Sync banes to related characters
        this.syncBanesToRelatedCharacters();
        
        this.autoSave();
    }

    // Add perk
    addPerk() {
        if (!this.currentCharacter) return;
        
        const perkSelect = document.getElementById('perkSelect');
        const perkName = perkSelect.value;
        
        if (!perkName) {
            this.showNotification('Please select a perk.', 'error');
            return;
        }
        
        // Check if already at maximum perks (2)
        if (this.currentCharacter.perks.length >= 2) {
            this.showNotification('You can only have a maximum of 2 perks.', 'error');
            return;
        }
        
        const databasePerk = window.GAME_DATABASE.perks.find(p => p.name === perkName);
        if (!databasePerk) {
            this.showNotification('Selected perk not found in database.', 'error');
            return;
        }
        
        const perk = {
            name: perkName
        };
        
        this.currentCharacter.perks.push(perk);
        this.populatePerks();
        
        // Sync perks to related characters
        this.syncPerksToRelatedCharacters();
        
        this.autoSave();
        
        // Reset form
        perkSelect.value = '';
        document.getElementById('perkPreview').style.display = 'none';
        
        this.showNotification(`Added perk: ${perkName}`, 'success');
    }

    // Remove perk
    removePerk(perkName) {
        if (!this.currentCharacter) return;
        
        this.currentCharacter.perks = this.currentCharacter.perks.filter(p => p.name !== perkName);
        this.populatePerks();
        
        // Sync perks to related characters
        this.syncPerksToRelatedCharacters();
        
        this.autoSave();
    }

    // Add flaw
    addFlaw() {
        if (!this.currentCharacter) return;
        
        const flawSelect = document.getElementById('flawSelect');
        const flawName = flawSelect.value;
        
        if (!flawName) {
            this.showNotification('Please select a flaw.', 'error');
            return;
        }
        
        // Check if already at maximum flaws (2)
        if (this.currentCharacter.flaws.length >= 2) {
            this.showNotification('You can only have a maximum of 2 flaws.', 'error');
            return;
        }
        
        const databaseFlaw = window.GAME_DATABASE.flaws.find(f => f.name === flawName);
        if (!databaseFlaw) {
            this.showNotification('Selected flaw not found in database.', 'error');
            return;
        }
        
        const flaw = {
            name: flawName
        };
        
        this.currentCharacter.flaws.push(flaw);
        this.populateFlaws();
        
        // Sync flaws to related characters
        this.syncFlawsToRelatedCharacters();
        
        this.autoSave();
        
        // Reset form
        flawSelect.value = '';
        document.getElementById('flawPreview').style.display = 'none';
        
        this.showNotification(`Added flaw: ${flawName}`, 'success');
    }

    // Remove flaw
    removeFlaw(flawName) {
        if (!this.currentCharacter) return;
        
        this.currentCharacter.flaws = this.currentCharacter.flaws.filter(f => f.name !== flawName);
        this.populateFlaws();
        
        // Sync flaws to related characters
        this.syncFlawsToRelatedCharacters();
        
        this.autoSave();
    }

    // Manage feat-based advantages
    updateFeatBasedAdvantages() {
        if (!this.currentCharacter || !this.currentCharacter.advantages) return;
        
        // Ensure advantages array exists
        if (!this.currentCharacter.advantages) {
            this.currentCharacter.advantages = [];
        }
        
        // Check for Lethal Strike feat
        const lethalStrikeFeat = this.currentCharacter.feats.find(feat => feat.name === 'Lethal Strike');
        const lethalStrikeTier = lethalStrikeFeat ? lethalStrikeFeat.tier : 0;
        
        // Check for Resilient feat
        const resilientFeat = this.currentCharacter.feats.find(feat => feat.name === 'Resilient');
        const hasResilient = resilientFeat ? true : false;
        
        // Check for Attack Specialization feats
        const attackSpecializationFeats = this.currentCharacter.feats.filter(feat => feat.name === 'Attack Specialization');
        
        // Remove existing feat-based and weapon-based advantages
        this.currentCharacter.advantages = this.currentCharacter.advantages.filter(adv => {
            // Keep advantages that are not feat-based or weapon-based
            if (adv.name !== 'Lethal Strike' && adv.name !== 'Resist Bane') {
                // Check if it's an Attack Specialization advantage
                if (adv.name.startsWith('Attack Specialization:')) {
                    return false; // Remove existing Attack Specialization advantages
                }
                // Check if it's a Bane Focus advantage
                if (adv.name.startsWith('Bane Attack:')) {
                    return false; // Remove existing Bane Focus advantages
                }
                // Check if it's a Boon Focus advantage
                if (adv.name.startsWith('Boon Focus:')) {
                    return false; // Remove existing Boon Focus advantages
                }
                // Check if it's a Deadly weapon advantage
                if (adv.name.includes('Deadly')) {
                    return false; // Remove existing Deadly weapon advantages
                }
                // Check if it's a Two-Handed or Dual-Wield advantage
                if (adv.name === 'Two-Handed Weapon' || adv.name === '2 One-Handed Weapons') {
                    return false; // Remove existing two-handed/dual-wield advantages
                }
                return true; // Keep other advantages
            }
            return false; // Remove Lethal Strike and Resist Bane
        });
        
        // Add Lethal Strike advantage if character has the feat
        if (lethalStrikeTier > 0) {
            this.currentCharacter.advantages.push({
                name: 'Lethal Strike',
                attribute: 'Agility',
                count: lethalStrikeTier
            });
        }
        
        // Add Resist Bane advantage for all attributes if character has Resilient feat
        if (hasResilient) {
            this.currentCharacter.advantages.push({
                name: 'Resist Bane',
                attribute: 'all attributes',
                count: 1
            });
        }
        
        // Add Attack Specialization advantages for each instance of the feat
        attackSpecializationFeats.forEach(feat => {
            if (feat.tier > 0 && feat.customDetails) {
                this.currentCharacter.advantages.push({
                    name: `Attack Specialization: ${feat.customDetails}`,
                    attribute: 'all attributes', // Applies to all attributes since weapons can use different attributes
                    count: feat.tier
                });
            }
        });
        
        // Add Bane Focus advantages for each instance of the feat
        const baneFocusFeats = this.currentCharacter.feats.filter(feat => feat.name === 'Bane Focus');
        baneFocusFeats.forEach(feat => {
            if (feat.tier > 0 && feat.customDetails) {
                this.currentCharacter.advantages.push({
                    name: `Bane Attack: ${feat.customDetails}`,
                    attribute: 'all attributes',
                    count: 2 // Advantage 2 on bane attack roll as per feat description
                });
            }
        });
        
        // Add Boon Focus advantages for each instance of the feat
        const boonFocusFeats = this.currentCharacter.feats.filter(feat => feat.name === 'Boon Focus');
        boonFocusFeats.forEach(feat => {
            if (feat.tier > 0 && feat.customDetails) {
                // Calculate advantage value based on tier and boon duration
                let advantageValue = 0;
                
                if (feat.tier === 1) {
                    advantageValue = 2;
                } else if (feat.tier === 2) {
                    advantageValue = 3;
                } else if (feat.tier === 3) {
                    // For tier 3, check the boon's duration
                    const selectedBoon = window.GAME_DATABASE.boons.find(boon => boon.name === feat.customDetails);
                    if (selectedBoon && selectedBoon.duration && selectedBoon.duration.toLowerCase().includes('sustained')) {
                        advantageValue = 4; // Sustained duration = advantage 4
                    } else {
                        advantageValue = 5; // Other durations = advantage 5
                    }
                }
                
                this.currentCharacter.advantages.push({
                    name: `Boon Focus: ${feat.customDetails}`,
                    attribute: 'all attributes',
                    count: advantageValue
                });
            }
        });
        
        // Add Deadly weapon advantages for equipped weapons
        if (this.currentCharacter.equipment) {
            const equippedWeapons = this.currentCharacter.equipment.filter(e => e.equipped && e.type === 'weapon');
            
            equippedWeapons.forEach(weapon => {
                // Check if weapon has deadly property
                if (weapon.properties && weapon.properties.includes('deadly') && weapon.deadlyValue) {
                    const deadlyValue = weapon.deadlyValue;
                    
                    // Check if weapon has forceful property (adds Might advantage)
                    if (weapon.properties.includes('forceful')) {
                        this.currentCharacter.advantages.push({
                            name: `${weapon.name} Deadly`,
                            attribute: 'Might',
                            count: deadlyValue
                        });
                    }
                    
                    // Check if weapon has precise property (adds Agility advantage)
                    if (weapon.properties.includes('precise')) {
                        this.currentCharacter.advantages.push({
                            name: `${weapon.name} Deadly`,
                            attribute: 'Agility',
                            count: deadlyValue
                        });
                    }
                }
            });
            
            // Add advantages for two-handed melee weapons or dual-wielding (excluding defensive weapons)
            // Filter out weapons with defensive property
            const meleeWeapons = equippedWeapons.filter(weapon => {
                // Exclude weapons with defensive property
                if (weapon.properties && weapon.properties.includes('defensive')) {
                    return false;
                }
                // Only melee weapons - check weaponCategory for melee types
                if (weapon.weaponCategory) {
                    return weapon.weaponCategory === 'one-handed-melee' || 
                           weapon.weaponCategory === 'two-handed-melee' || 
                           weapon.weaponCategory === 'versatile-melee';
                }
                // Fallback: if no weaponCategory, check if no range
                return !weapon.rangeIncrement || weapon.rangeIncrement === '';
            });
            
            if (meleeWeapons.length > 0) {
                // Check for two-handed weapon
                const twoHandedWeapon = meleeWeapons.find(weapon => 
                    weapon.weaponCategory === 'two-handed-melee'
                );
                
                // Check for dual-wielding (2 one-handed melee weapons)
                const oneHandedWeapons = meleeWeapons.filter(weapon => 
                    weapon.weaponCategory === 'one-handed-melee' || weapon.weaponCategory === 'versatile-melee'
                );
                
                if (twoHandedWeapon) {
                    // Two-handed weapon: Add advantage 1 for all attributes
                    this.currentCharacter.advantages.push({
                        name: 'Two-Handed Weapon',
                        attribute: 'all attributes',
                        count: 1
                    });
                } else if (oneHandedWeapons.length >= 2) {
                    // Dual-wielding: Add advantage 1 for all attributes
                    this.currentCharacter.advantages.push({
                        name: '2 One-Handed Weapons',
                        attribute: 'all attributes',
                        count: 1
                    });
                }
            }
        }
    }

    // Populate advantages list
    populateAdvantages() {
        if (!this.currentCharacter) return;
        
        // Update feat-based advantages before populating
        this.updateFeatBasedAdvantages();
        
        const advantagesList = document.getElementById('advantagesList');
        advantagesList.innerHTML = '';
        
        // Sort advantages alphabetically by name
        const sortedAdvantages = this.sortItemsAlphabetically(this.currentCharacter.advantages);
        
        sortedAdvantages.forEach(advantage => {
            const item = document.createElement('div');
            item.className = 'checkbox-item';
            const count = advantage.count || 1;
            
            // Check if this is a feat-based or weapon-based advantage (should not be removable)
            const isFeatBased = advantage.name === 'Lethal Strike' || 
                               advantage.name === 'Resist Bane' || 
                               advantage.name.startsWith('Attack Specialization:') ||
                               advantage.name.startsWith('Bane Attack:') ||
                               advantage.name.startsWith('Boon Focus:') ||
                               advantage.name.includes('Deadly') ||
                               advantage.name === 'Two-Handed Weapon' ||
                               advantage.name === '2 One-Handed Weapons';
            
            item.innerHTML = `
                <input type="checkbox" id="adv_${advantage.name}" checked>
                <label for="adv_${advantage.name}">${advantage.name} (x${count})</label>
                <span class="advantage-attribute">${advantage.attribute}</span>
                ${!isFeatBased ? `<button class="remove-advantage-btn" id="remove-adv-${advantage.name}" onclick="window.app.removeAdvantage('${advantage.name}')">×</button>` : ''}
            `;
            
            // Add change event listener to update counts
            const checkbox = item.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => {
                this.updateAdvantageCount();
                this.updateDisadvantageCount();
                this.updateAdvantageDisadvantageCalculation();
            });
            
            advantagesList.appendChild(item);
        });
        
        this.updateAdvantageCount();
        this.filterAdvantages();
    }


    // Filter advantages and disadvantages by attribute
    filterAdvantages() {
        const filter = document.getElementById('advantageFilter').value.toLowerCase();
        const advantages = document.querySelectorAll('#advantagesList .checkbox-item');
        const disadvantages = document.querySelectorAll('#disadvantagesList .checkbox-item');
        
        // Filter advantages
        advantages.forEach(advantage => {
            const attributeSpan = advantage.querySelector('.advantage-attribute');
            if (!attributeSpan) return; // Skip if no attribute span found
            
            const attributeText = attributeSpan.textContent.toLowerCase().trim();
            // Always show "All Attributes" and "Any" regardless of filter
            const isUniversal = attributeText === 'all' || attributeText === 'any' || attributeText === 'all attributes';
            const matchesFilter = filter === 'all' || attributeText === filter || isUniversal;
            
            if (matchesFilter) {
                advantage.style.display = 'flex';
            } else {
                advantage.style.display = 'none';
            }
        });
        
        // Filter disadvantages
        disadvantages.forEach(disadvantage => {
            const attributeSpan = disadvantage.querySelector('.advantage-attribute');
            if (!attributeSpan) return; // Skip if no attribute span found
            
            const attributeText = attributeSpan.textContent.toLowerCase().trim();
            // Always show "All Attributes" and "Any" regardless of filter
            const isUniversal = attributeText === 'all' || attributeText === 'any' || attributeText === 'all attributes';
            const matchesFilter = filter === 'all' || attributeText === filter || isUniversal;
            
            if (matchesFilter) {
                disadvantage.style.display = 'flex';
            } else {
                disadvantage.style.display = 'none';
            }
        });
        
        this.updateAdvantageCount();
        this.updateDisadvantageCount();
        this.updateAdvantageDisadvantageCalculation();
    }

    // Update advantage/disadvantage calculation
    updateAdvantageDisadvantageCalculation() {
        const filter = document.getElementById('advantageFilter').value.toLowerCase();
        
        // Count active advantages (visible and checked) with their counts
        const activeAdvantages = Array.from(document.querySelectorAll('#advantagesList .checkbox-item'))
            .filter(item => {
                const attributeSpan = item.querySelector('.advantage-attribute');
                if (!attributeSpan) return false;
                
                const attributeText = attributeSpan.textContent.toLowerCase().trim();
                const isUniversal = attributeText === 'all' || attributeText === 'any' || attributeText === 'all attributes';
                const matchesFilter = filter === 'all' || attributeText === filter || isUniversal;
                
                return matchesFilter && item.style.display !== 'none' && item.querySelector('input[type="checkbox"]').checked;
            })
            .reduce((total, item) => {
                // Find the advantage in the character data to get the actual count
                const advantageName = item.querySelector('label').textContent.replace(/ \(x\d+\)/, '');
                const advantage = this.currentCharacter.advantages.find(a => a.name === advantageName);
                const count = advantage ? (advantage.count || 1) : 1;
                return total + count;
            }, 0);
        
        // Count active disadvantages (visible and checked) with their counts
        const activeDisadvantages = Array.from(document.querySelectorAll('#disadvantagesList .checkbox-item'))
            .filter(item => {
                const attributeSpan = item.querySelector('.advantage-attribute');
                if (!attributeSpan) return false;
                
                const attributeText = attributeSpan.textContent.toLowerCase().trim();
                const isUniversal = attributeText === 'all' || attributeText === 'any' || attributeText === 'all attributes';
                const matchesFilter = filter === 'all' || attributeText === filter || isUniversal;
                
                return matchesFilter && item.style.display !== 'none' && item.querySelector('input[type="checkbox"]').checked;
            })
            .reduce((total, item) => {
                // Find the disadvantage in the character data to get the actual count
                const disadvantageName = item.querySelector('label').textContent.replace(/ \(x\d+\)/, '');
                const disadvantage = this.currentCharacter.disadvantages.find(d => d.name === disadvantageName);
                const count = disadvantage ? (disadvantage.count || 1) : 1;
                return total + count;
            }, 0);
        
        // Calculate the difference
        const difference = activeAdvantages - activeDisadvantages;
        
        // Update the display
        const resultElement = document.getElementById('advantageDisadvantageResult');
        if (difference > 0) {
            resultElement.textContent = `Advantage: ${difference}`;
        } else if (difference < 0) {
            resultElement.textContent = `Disadvantage: ${Math.abs(difference)}`;
        } else {
            resultElement.textContent = 'Advantage: 0';
        }
        
        // Refresh favorite actions to update their advantage/disadvantage displays
        this.populateFavoriteActions();
    }

    // Update advantage count
    updateAdvantageCount() {
        const filter = document.getElementById('advantageFilter').value.toLowerCase();
        const visibleAdvantages = Array.from(document.querySelectorAll('#advantagesList .checkbox-item'))
            .filter(item => {
                const attributeSpan = item.querySelector('.advantage-attribute');
                if (!attributeSpan) return false;
                
                const attributeText = attributeSpan.textContent.toLowerCase().trim();
                const isUniversal = attributeText === 'all' || attributeText === 'any' || attributeText === 'all attributes';
                const matchesFilter = filter === 'all' || attributeText === filter || isUniversal;
                
                // Only count if visible AND checked
                return matchesFilter && item.style.display !== 'none' && item.querySelector('input[type="checkbox"]').checked;
            })
            .reduce((total, item) => {
                // Find the advantage in the character data to get the actual count
                const advantageName = item.querySelector('label').textContent.replace(/ \(x\d+\)/, '');
                const advantage = this.currentCharacter.advantages.find(a => a.name === advantageName);
                const count = advantage ? (advantage.count || 1) : 1;
                return total + count;
            }, 0);
        
        document.getElementById('advantageCount').textContent = visibleAdvantages;
    }

    // Populate disadvantages list
    populateDisadvantages() {
        if (!this.currentCharacter) return;
        
        const disadvantagesList = document.getElementById('disadvantagesList');
        disadvantagesList.innerHTML = '';
        
        // Sort disadvantages alphabetically by name
        const sortedDisadvantages = this.sortItemsAlphabetically(this.currentCharacter.disadvantages);
        
        sortedDisadvantages.forEach(disadvantage => {
            const item = document.createElement('div');
            item.className = 'checkbox-item';
            const count = disadvantage.count || 1;
            item.innerHTML = `
                <input type="checkbox" id="dis_${disadvantage.name}" checked>
                <label for="dis_${disadvantage.name}">${disadvantage.name} (x${count})</label>
                <span class="advantage-attribute">${disadvantage.attribute}</span>
                <button class="remove-disadvantage-btn" id="remove-dis-${disadvantage.name}" onclick="window.app.removeDisadvantage('${disadvantage.name}')">×</button>
            `;
            
            // Add change event listener to update counts
            const checkbox = item.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => {
                this.updateAdvantageCount();
                this.updateDisadvantageCount();
                this.updateAdvantageDisadvantageCalculation();
            });
            
            disadvantagesList.appendChild(item);
        });
        
        this.updateDisadvantageCount();
        this.updateAdvantageDisadvantageCalculation();
    }

    // Update disadvantage count
    updateDisadvantageCount() {
        const filter = document.getElementById('advantageFilter').value.toLowerCase();
        const visibleDisadvantages = Array.from(document.querySelectorAll('#disadvantagesList .checkbox-item'))
            .filter(item => {
                const attributeSpan = item.querySelector('.advantage-attribute');
                if (!attributeSpan) return false;
                
                const attributeText = attributeSpan.textContent.toLowerCase().trim();
                const isUniversal = attributeText === 'all' || attributeText === 'any' || attributeText === 'all attributes';
                const matchesFilter = filter === 'all' || attributeText === filter || isUniversal;
                
                // Only count if visible AND checked
                return matchesFilter && item.style.display !== 'none' && item.querySelector('input[type="checkbox"]').checked;
            })
            .reduce((total, item) => {
                // Find the disadvantage in the character data to get the actual count
                const disadvantageName = item.querySelector('label').textContent.replace(/ \(x\d+\)/, '');
                const disadvantage = this.currentCharacter.disadvantages.find(d => d.name === disadvantageName);
                const count = disadvantage ? (disadvantage.count || 1) : 1;
                return total + count;
            }, 0);
        
        document.getElementById('disadvantageCount').textContent = visibleDisadvantages;
    }

    // Populate boons list
    populateBoons() {
        if (!this.currentCharacter) return;
        
        const boonTracker = document.getElementById('boonTracker');
        boonTracker.innerHTML = '';
        
        // Sort boons alphabetically by name
        const sortedBoons = this.sortItemsAlphabetically(this.currentCharacter.boons);
        
        sortedBoons.forEach(boon => {
            const item = document.createElement('div');
            item.className = 'boon-item';
            
            // Check both database and custom boons
            let foundBoon = window.GAME_DATABASE.boons.find(b => b.name === boon.name);
            if (!foundBoon && this.customBoons) {
                foundBoon = this.customBoons.find(b => b.name === boon.name);
            }
            
            item.innerHTML = `
                <div class="boon-overview">
                    <div class="boon-info">
                        <span class="boon-name">${boon.name}${foundBoon && foundBoon.isCustom ? ' <span class="custom-badge">(Custom)</span>' : ''}</span>
                        ${boon.sustaining ? '<span class="sustaining-indicator">⚡ Sustaining</span>' : ''}
                        <span class="boon-power-level">PL ${boon.powerLevel}</span>
                        <span class="boon-duration">${boon.duration}</span>
                        ${boon.isPersistent ? 
                            `<span class="boon-source persistent-indicator">🔒 ${boon.source}</span>` : 
                            ''
                        }
                    </div>
                    <div class="boon-actions">
                        <span class="expand-indicator">▼</span>
                        ${boon.isPersistent ? 
                            `<span class="persistent-lock" title="Cannot be removed while equipment is equipped">🔒</span>` : 
                            `<button class="remove-item" onclick="window.app.removeBoon('${boon.name}')">×</button>`
                        }
                    </div>
                </div>
                ${foundBoon ? `
                    <div class="boon-details" style="display: none;">
                        <div class="boon-description"><strong>Description:</strong> ${foundBoon.generalDescription}</div>
                        <div class="boon-effect"><strong>Effect:</strong> ${foundBoon.effectDescription}</div>
                        <div class="boon-power-level-effect"><strong>PL ${boon.powerLevel} Effect:</strong> ${foundBoon.powerLevelDescriptions && foundBoon.powerLevelDescriptions[boon.powerLevel] ? foundBoon.powerLevelDescriptions[boon.powerLevel].description : (foundBoon.powerLevels.length === 1 ? foundBoon.effectDescription : 'No specific effect for this power level.')}</div>
                        ${foundBoon.specialText ? `<div class="boon-special"><strong>Special:</strong> ${foundBoon.specialText}</div>` : ''}
                    </div>
                ` : ''}
            `;
            
            // Add click event to expand/collapse boon details
            if (foundBoon) {
                item.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('remove-item') && !e.target.classList.contains('sustain-checkbox') && e.target.type !== 'checkbox') {
                        const detailsDiv = item.querySelector('.boon-details');
                        const expandIndicator = item.querySelector('.expand-indicator');
                        if (detailsDiv) {
                            const isExpanded = detailsDiv.style.display === 'block';
                            detailsDiv.style.display = isExpanded ? 'none' : 'block';
                            item.classList.toggle('expanded');
                            if (expandIndicator) {
                                expandIndicator.textContent = isExpanded ? '▼' : '▲';
                            }
                        }
                    }
                });
            }
            
            boonTracker.appendChild(item);
        });
    }

    // Update boon sustaining status
    updateBoonSustaining(boonName, isSustaining) {
        if (!this.currentCharacter) return;
        
        const boon = this.currentCharacter.boons.find(b => b.name === boonName);
        if (boon) {
            boon.sustaining = isSustaining;
            this.updateAdvantageDisadvantageCalculation();
            this.autoSave();
        }
    }

    // Populate banes list
    populateBanes() {
        if (!this.currentCharacter) return;
        
        const baneTracker = document.getElementById('baneTracker');
        baneTracker.innerHTML = '';
        
        // Sort banes alphabetically by name
        const sortedBanes = this.sortItemsAlphabetically(this.currentCharacter.banes);
        
        sortedBanes.forEach(bane => {
            const item = document.createElement('div');
            item.className = 'bane-item';
            
            // Check both database and custom banes
            let foundBane = window.GAME_DATABASE.banes.find(b => b.name === bane.name);
            if (!foundBane && this.customBanes) {
                foundBane = this.customBanes.find(b => b.name === bane.name);
            }
            
            // Special handling for Fatigued bane with level dropdown
            const fatigueLevelDropdown = bane.name === 'Fatigued' ? `
                <div class="fatigue-level-control">
                    <label>Fatigue Level:</label>
                    <select onchange="window.app.updateFatigueLevel(window.app.currentCharacter.banes.find(b => b.name === '${bane.name}'), this.value)">
                        <option value="1" ${bane.fatigueLevel === 1 ? 'selected' : ''}>1 - Non-Attack Actions</option>
                        <option value="2" ${bane.fatigueLevel === 2 ? 'selected' : ''}>2 - Slowed</option>
                        <option value="3" ${bane.fatigueLevel === 3 ? 'selected' : ''}>3 - Attack Rolls</option>
                        <option value="4" ${bane.fatigueLevel === 4 ? 'selected' : ''}>4 - Defense Penalties</option>
                        <option value="5" ${bane.fatigueLevel === 5 ? 'selected' : ''}>5 - Unconscious</option>
                        <option value="6" ${bane.fatigueLevel === 6 ? 'selected' : ''}>6 - Death</option>
                    </select>
                </div>
            ` : '';
            
            item.innerHTML = `
                <div class="bane-overview">
                    <div class="bane-info">
                        <span class="bane-name">${bane.name}${foundBane && foundBane.isCustom ? ' <span class="custom-badge">(Custom)</span>' : ''}</span>
                        <span class="bane-power-level">PL ${bane.powerLevel}</span>
                        <span class="bane-duration">${bane.duration}</span>
                        ${bane.name === 'Fatigued' && bane.fatigueLevel ? `<span class="bane-fatigue-level">Level ${bane.fatigueLevel}</span>` : ''}
                    </div>
                    <div class="bane-actions">
                        <span class="expand-indicator">▼</span>
                        ${bane.removable !== false ? 
                            `<button class="remove-item" onclick="window.app.removeBane('${bane.name}')">×</button>` : 
                            (bane.source === 'Fatigued Bane' ? 
                                '<span class="cursed-indicator" title="Cannot remove - added by Fatigued bane">🔒</span>' : 
                                (bane.source === 'Incapacitated Bane' ? 
                                    '<span class="cursed-indicator" title="Cannot remove - added by Incapacitated bane">🔒</span>' : 
                                    '<span class="cursed-indicator" title="Cannot remove - cursed item equipped">🔒</span>'
                                )
                            )
                        }
                    </div>
                </div>
                ${fatigueLevelDropdown}
                <div class="bane-resist-checkboxes">
                    <label><input type="checkbox" ${bane.resists[0] ? 'checked' : ''} 
                           onchange="window.app.updateBaneResist('${bane.name}', 0, this.checked)"> Resist 1</label>
                    <label><input type="checkbox" ${bane.resists[1] ? 'checked' : ''} 
                           onchange="window.app.updateBaneResist('${bane.name}', 1, this.checked)"> Resist 2</label>
                    <label><input type="checkbox" ${bane.resists[2] ? 'checked' : ''} 
                           onchange="window.app.updateBaneResist('${bane.name}', 2, this.checked)"> Resist 3</label>
                </div>
                ${foundBane ? `
                    <div class="bane-details" style="display: none;">
                        <div class="bane-description"><strong>Description:</strong> ${foundBane.generalDescription}</div>
                        <div class="bane-effect"><strong>Effect:</strong> ${foundBane.effectDescription}</div>
                        <div class="bane-power-level-effect"><strong>PL ${bane.powerLevel} Effect:</strong> ${foundBane.powerLevelDescriptions && foundBane.powerLevelDescriptions[bane.powerLevel] ? foundBane.powerLevelDescriptions[bane.powerLevel].description : (foundBane.powerLevels.length === 1 ? foundBane.effectDescription : 'No specific effect for this power level.')}</div>
                        ${foundBane.specialText ? `<div class="bane-special"><strong>Special:</strong> ${foundBane.specialText}</div>` : ''}
                    </div>
                ` : ''}
            `;
            
            // Add click event to expand/collapse bane details
            if (foundBane) {
                item.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('remove-item') && e.target.type !== 'checkbox' && e.target.tagName !== 'SELECT' && !e.target.closest('label') && !e.target.closest('.fatigue-level-control')) {
                        const detailsDiv = item.querySelector('.bane-details');
                        const expandIndicator = item.querySelector('.expand-indicator');
                        if (detailsDiv) {
                            const isExpanded = detailsDiv.style.display === 'block';
                            detailsDiv.style.display = isExpanded ? 'none' : 'block';
                            item.classList.toggle('expanded');
                            if (expandIndicator) {
                                expandIndicator.textContent = isExpanded ? '▼' : '▲';
                            }
                        }
                    }
                });
            }
            
            baneTracker.appendChild(item);
        });
    }

    // Update bane resist status
    updateBaneResist(baneName, resistIndex, isResisted) {
        if (!this.currentCharacter) return;
        
        const bane = this.currentCharacter.banes.find(b => b.name === baneName);
        if (bane && bane.resists) {
            bane.resists[resistIndex] = isResisted;
            this.updateAdvantageDisadvantageCalculation();
            this.autoSave();
        }
    }

    // Populate perks list
    populatePerks() {
        if (!this.currentCharacter) return;
        
        const perksList = document.getElementById('perksList');
        perksList.innerHTML = '';
        
        // Sort perks alphabetically by name
        const sortedPerks = this.sortItemsAlphabetically(this.currentCharacter.perks);
        
        sortedPerks.forEach(perk => {
            const item = document.createElement('div');
            item.className = 'perk-item';
            
            const databasePerk = window.GAME_DATABASE.perks.find(p => p.name === perk.name);
            
            item.innerHTML = `
                <div class="perk-overview">
                    <span class="perk-name">${perk.name}</span>
                    <button class="remove-item editable-only" onclick="window.app.removePerk('${perk.name}')">×</button>
                </div>
                ${databasePerk ? `
                    <div class="perk-details" style="display: none;">
                        <div class="perk-description">${databasePerk.description}</div>
                        <div class="perk-effect"><strong>Effect:</strong> ${databasePerk.effect}</div>
                    </div>
                ` : ''}
            `;
            
            // Add click event to expand/collapse perk details
            if (databasePerk) {
                item.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('remove-item')) {
                        const detailsDiv = item.querySelector('.perk-details');
                        if (detailsDiv) {
                            detailsDiv.style.display = detailsDiv.style.display === 'none' ? 'block' : 'none';
                            item.classList.toggle('expanded');
                        }
                    }
                });
            }
            
            perksList.appendChild(item);
        });
    }

    // Populate flaws list
    populateFlaws() {
        if (!this.currentCharacter) return;
        
        const flawsList = document.getElementById('flawsList');
        flawsList.innerHTML = '';
        
        // Sort flaws alphabetically by name
        const sortedFlaws = this.sortItemsAlphabetically(this.currentCharacter.flaws);
        
        sortedFlaws.forEach(flaw => {
            const item = document.createElement('div');
            item.className = 'flaw-item';
            
            const databaseFlaw = window.GAME_DATABASE.flaws.find(f => f.name === flaw.name);
            
            item.innerHTML = `
                <div class="flaw-overview">
                    <span class="flaw-name">${flaw.name}</span>
                    <button class="remove-item editable-only" onclick="window.app.removeFlaw('${flaw.name}')">×</button>
                </div>
                ${databaseFlaw ? `
                    <div class="flaw-details" style="display: none;">
                        <div class="flaw-description">${databaseFlaw.description}</div>
                    </div>
                ` : ''}
            `;
            
            // Add click event to expand/collapse flaw details
            if (databaseFlaw) {
                item.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('remove-item')) {
                        const detailsDiv = item.querySelector('.flaw-details');
                        if (detailsDiv) {
                            detailsDiv.style.display = detailsDiv.style.display === 'none' ? 'block' : 'none';
                            item.classList.toggle('expanded');
                        }
                    }
                });
            }
            
            flawsList.appendChild(item);
        });
    }





    // Save current character
    saveCurrentCharacter() {
        if (!this.currentCharacter) return;
        
        this.saveCurrentCharacterSilently();
        this.showNotification('Character saved successfully!', 'success');
        
        // Switch to view mode after saving
        this.enableViewMode();
    }

    // Toggle between view mode and edit mode
    toggleViewMode() {
        const characterSheetPage = document.getElementById('characterSheetPage');
        const isViewMode = characterSheetPage.classList.contains('view-mode');
        
        if (isViewMode) {
            this.disableViewMode();
        } else {
            this.enableViewMode();
        }
    }

    // Enable view mode (read-only)
    enableViewMode() {
        const characterSheetPage = document.getElementById('characterSheetPage');
        characterSheetPage.classList.add('view-mode');
        
        // Update button text and icon
        const saveBtn = document.getElementById('saveCharBtn');
        const editBtn = document.getElementById('editCharBtn');
        
        saveBtn.style.display = 'none';
        editBtn.style.display = 'inline-flex';
        
        // Update switch sections based on character data (works in both view and edit mode)
        this.updateAlternateFormSwitch();
        this.updateCompanionSwitch();
        
        // Manual check to ensure sections are hidden if they should be (fixes timing issues)
        setTimeout(() => {
            this.updateAlternateFormSwitch();
            this.updateCompanionSwitch();
        }, 100);
        
        // Update equipment display for view mode
        this.updateEquipmentViewMode();
        
        // Show all sections in one-page view mode
        this.switchSection('stats'); // This will now show all sections in view mode
        
        this.showNotification('Character sheet is now in view mode', 'info');
    }

    // Disable view mode (enable editing)
    disableViewMode() {
        const characterSheetPage = document.getElementById('characterSheetPage');
        characterSheetPage.classList.remove('view-mode');
        
        // Update button text and icon
        const saveBtn = document.getElementById('saveCharBtn');
        const editBtn = document.getElementById('editCharBtn');
        
        saveBtn.style.display = 'inline-flex';
        editBtn.style.display = 'none';
        
        // Update switch sections based on character data (works in both view and edit mode)
        this.updateAlternateFormSwitch();
        this.updateCompanionSwitch();
        
        // Update equipment display for edit mode
        this.updateEquipmentViewMode();
        
        // Populate dropdowns when switching to edit mode (in case they weren't populated initially)
        setTimeout(() => {
            this.populateAllDropdowns();
        }, 100);
        
        // Automatically select stats tab when switching to edit mode
        this.switchSection('stats');
        
        this.showNotification('Character sheet is now in edit mode', 'info');
    }

    // Auto-save character
    autoSave() {
        if (this.currentCharacter) {
            // Save without showing notification
            this.saveCurrentCharacterSilently();
        }
    }

    // Save current character silently (for auto-save)
    saveCurrentCharacterSilently() {
        if (!this.currentCharacter) return;
        
        // Update character data from form
        this.currentCharacter.name = document.getElementById('charName').value;
        this.currentCharacter.archetype = document.getElementById('charArchetype').value;
        
        // Update wealth data from either edit mode or view mode controls
        const wealthScoreInput = document.getElementById('wealthScore');
        const viewWealthScoreInput = document.getElementById('viewWealthScore');
        const wealthUsedCheckbox = document.getElementById('wealthUsed');
        const viewWealthUsedCheckbox = document.getElementById('viewWealthUsed');
        
        if (wealthScoreInput) {
            this.currentCharacter.wealthScore = parseInt(wealthScoreInput.value) || 0;
        } else if (viewWealthScoreInput) {
            this.currentCharacter.wealthScore = parseInt(viewWealthScoreInput.value) || 0;
        }
        
        if (wealthUsedCheckbox) {
            this.currentCharacter.wealthUsed = wealthUsedCheckbox.checked;
        } else if (viewWealthUsedCheckbox) {
            this.currentCharacter.wealthUsed = viewWealthUsedCheckbox.checked;
        }
        
        this.currentCharacter.charDescription = document.getElementById('charDescription').value;
        this.currentCharacter.charBackground = document.getElementById('charBackground').value;
        this.currentCharacter.charNotes = document.getElementById('charNotes').value;
        
        // Save combat stats
        this.currentCharacter.legendPoints = parseInt(document.getElementById('legendPoints').textContent) || 0;
        // swiftWeaponAdvantage removed - no longer needed
        
        // Update attributes
        Object.keys(this.currentCharacter.attributes).forEach(attr => {
            const element = document.getElementById(attr);
            if (element) {
                this.currentCharacter.attributes[attr] = parseInt(element.textContent) || 0;
            }
        });
        
        // Update displays
        this.updateAttributeDisplays();
        this.updateDefenseStats();
        this.updateMaxHP();
        
        // Save to storage
        this.saveCharacters();
    }

    // Delete character from main page
    deleteCharacter(characterId) {
        const character = this.characters.find(c => c.id === characterId);
        if (!character) return;
        
        if (confirm(`Are you sure you want to delete "${character.name}"?`)) {
            this.characters = this.characters.filter(c => c.id !== characterId);
            this.saveCharacters();
            this.updateCharacterGrid();
            
            if (this.currentCharacter && this.currentCharacter.id === characterId) {
                this.currentCharacter = null;
                this.showMainPage();
            }
            
            this.showNotification('Character deleted successfully!', 'success');
        }
    }

    // Delete current character from character sheet
    deleteCurrentCharacter() {
        if (!this.currentCharacter) return;
        
        if (confirm(`Are you sure you want to delete "${this.currentCharacter.name}"?`)) {
            this.characters = this.characters.filter(c => c.id !== this.currentCharacter.id);
            this.saveCharacters();
            this.currentCharacter = null;
            this.showMainPage();
            
            this.showNotification('Character deleted successfully!', 'success');
        }
    }

    // Show import modal
    showImportModal() {
        document.getElementById('importModal').style.display = 'block';
        document.getElementById('importData').value = '';
        this.setupFileUpload();
    }

    // Setup file upload functionality
    setupFileUpload() {
        console.log('Setting up file upload functionality...');
        const fileUploadArea = document.getElementById('fileUploadArea');
        const jsonFileInput = document.getElementById('jsonFileInput');
        const uploadPlaceholder = document.getElementById('uploadPlaceholder');
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const removeFileBtn = document.getElementById('removeFileBtn');
        const uploadFileBtn = document.getElementById('uploadFileBtn');

        if (!fileUploadArea || !jsonFileInput || !uploadPlaceholder || !fileInfo || !fileName || !removeFileBtn || !uploadFileBtn) {
            console.error('Some file upload elements not found:', {
                fileUploadArea: !!fileUploadArea,
                jsonFileInput: !!jsonFileInput,
                uploadPlaceholder: !!uploadPlaceholder,
                fileInfo: !!fileInfo,
                fileName: !!fileName,
                removeFileBtn: !!removeFileBtn,
                uploadFileBtn: !!uploadFileBtn
            });
            return;
        }

        // Click to select file
        fileUploadArea.addEventListener('click', () => {
            jsonFileInput.click();
        });

        // File input change
        jsonFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileSelection(file);
            }
        });

        // Drag and drop functionality
        fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadArea.classList.add('dragover');
        });

        fileUploadArea.addEventListener('dragleave', () => {
            fileUploadArea.classList.remove('dragover');
        });

        fileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.type === 'application/json' || file.name.endsWith('.json')) {
                    this.handleFileSelection(file);
                } else {
                    this.showNotification('Please select a valid JSON file.', 'error');
                }
            }
        });

        // Remove file button
        removeFileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearFileSelection();
        });

        // Upload file button
        uploadFileBtn.addEventListener('click', () => {
            this.importFromFile();
        });
    }

    // Handle file selection
    handleFileSelection(file) {
        console.log('File selected:', file.name, file.type, file.size);
        const uploadPlaceholder = document.getElementById('uploadPlaceholder');
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const uploadFileBtn = document.getElementById('uploadFileBtn');

        // Update UI to show selected file
        fileName.textContent = file.name;
        uploadPlaceholder.style.display = 'none';
        fileInfo.style.display = 'flex';
        uploadFileBtn.style.display = 'inline-block';

        // Store the file for later use
        this.selectedFile = file;
    }

    // Clear file selection
    clearFileSelection() {
        const uploadPlaceholder = document.getElementById('uploadPlaceholder');
        const fileInfo = document.getElementById('fileInfo');
        const uploadFileBtn = document.getElementById('uploadFileBtn');
        const jsonFileInput = document.getElementById('jsonFileInput');

        uploadPlaceholder.style.display = 'block';
        fileInfo.style.display = 'none';
        uploadFileBtn.style.display = 'none';
        jsonFileInput.value = '';
        this.selectedFile = null;
    }

    // Import character from file
    importFromFile() {
        console.log('Importing from file:', this.selectedFile?.name);
        if (!this.selectedFile) {
            this.showNotification('No file selected.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.processImportedData(data);
            } catch (error) {
                this.showNotification('Invalid JSON file. Please check the file format.', 'error');
            }
        };

        reader.onerror = () => {
            this.showNotification('Error reading file. Please try again.', 'error');
        };

        reader.readAsText(this.selectedFile);
    }

    // Process imported data (handles both single characters and arrays)
    processImportedData(data) {
        console.log('Processing imported data:', data);
        console.log('Data type:', typeof data);
        console.log('Is array:', Array.isArray(data));
        
        if (Array.isArray(data)) {
            // Handle array of characters (potentially a hierarchy)
            if (data.length === 0) {
                this.showNotification('No characters found in the file.', 'error');
                return;
            }
            
            // Check if this is a character hierarchy by looking for alternate forms or companions
            const hasAlternateForms = data.some(char => char.isAlternateForm);
            const hasCompanions = data.some(char => char.isCompanion);
            
            if (hasAlternateForms || hasCompanions) {
                // This is a character hierarchy - process it specially
                this.processImportedCharacterHierarchy(data);
            } else {
                // Regular array of independent characters
                let successCount = 0;
                let errorCount = 0;
                
                data.forEach((character, index) => {
                    try {
                        if (this.validateCharacter(character)) {
                            this.processImportedCharacter(character);
                            successCount++;
                        } else {
                            errorCount++;
                        }
                    } catch (error) {
                        console.error(`Error processing character at index ${index}:`, error);
                        errorCount++;
                    }
                });
                
                if (successCount > 0) {
                    this.showNotification(`Successfully imported ${successCount} character${successCount > 1 ? 's' : ''}${errorCount > 0 ? ` (${errorCount} failed)` : ''}.`, 'success');
                }
            }
            
        } else {
            // Handle single character
            if (this.validateCharacter(data)) {
                this.processImportedCharacter(data);
            }
        }
    }

    // Validate character data
    validateCharacter(character) {
        if (!character || typeof character !== 'object') {
            console.error('Invalid character: not an object');
            return false;
        }
        
        if (!character.name || !character.attributes) {
            console.error('Validation failed:', {
                hasName: !!character.name,
                hasAttributes: !!character.attributes,
                nameType: typeof character.name,
                attributesType: typeof character.attributes
            });
            this.showNotification('Invalid character data format. Character must have a name and attributes.', 'error');
            return false;
        }
        
        // Check if attributes object has the required structure
        const requiredAttributes = [
            'agility', 'fortitude', 'might', 'learning', 'logic', 'perception', 'will',
            'deception', 'persuasion', 'presence', 'alteration', 'creation',
            'energy', 'entropy', 'influence', 'movement', 'prescience', 'protection'
        ];
        
        // Check if attributes object exists and is an object
        if (!character.attributes || typeof character.attributes !== 'object') {
            console.error('Attributes object is missing or invalid:', character.attributes);
            this.showNotification('Character must have a valid attributes object.', 'error');
            return false;
        }
        
        const missingAttributes = requiredAttributes.filter(attr => character.attributes[attr] === undefined);
        if (missingAttributes.length > 0) {
            console.error('Missing attributes:', missingAttributes);
            this.showNotification(`Missing required attributes: ${missingAttributes.join(', ')}`, 'error');
            return false;
        }
        
        return true;
    }

    // Process imported character hierarchy (maintains relationships)
    processImportedCharacterHierarchy(characters) {
        console.log('Processing imported character hierarchy:', characters);
        
        // Create a mapping from old IDs to new IDs
        const idMapping = new Map();
        
        // First pass: generate new IDs for all characters
        characters.forEach(character => {
            const newId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
            idMapping.set(character.id, newId);
            character.id = newId;
        });
        
        // Second pass: update relationships with new IDs
        characters.forEach(character => {
            // Update primaryCharacterId for alternate forms
            if (character.isAlternateForm && character.primaryCharacterId) {
                const newPrimaryId = idMapping.get(character.primaryCharacterId);
                if (newPrimaryId) {
                    character.primaryCharacterId = newPrimaryId;
                }
            }
            
            // Update parentCharacterId for companions
            if (character.isCompanion && character.parentCharacterId) {
                const newParentId = idMapping.get(character.parentCharacterId);
                if (newParentId) {
                    character.parentCharacterId = newParentId;
                }
            }
            
            // Update alternateForms array for primary characters
            if (character.alternateForms) {
                character.alternateForms.forEach(altForm => {
                    if (altForm.characterId) {
                        const newAltFormId = idMapping.get(altForm.characterId);
                        if (newAltFormId) {
                            altForm.characterId = newAltFormId;
                        }
                    }
                });
            }
            
            // Update companions array for parent characters
            if (character.companions) {
                character.companions.forEach(companion => {
                    if (companion.characterId) {
                        const newCompanionId = idMapping.get(companion.characterId);
                        if (newCompanionId) {
                            companion.characterId = newCompanionId;
                        }
                    }
                });
            }
            
            // Update alternateFormReferences array
            if (character.alternateFormReferences) {
                character.alternateFormReferences.forEach(altFormRef => {
                    if (altFormRef.characterId) {
                        const newAltFormId = idMapping.get(altFormRef.characterId);
                        if (newAltFormId) {
                            altFormRef.characterId = newAltFormId;
                        }
                    }
                });
            }
            
            // Update companionReferences array
            if (character.companionReferences) {
                character.companionReferences.forEach(companionRef => {
                    if (companionRef.characterId) {
                        const newCompanionId = idMapping.get(companionRef.characterId);
                        if (newCompanionId) {
                            companionRef.characterId = newCompanionId;
                        }
                    }
                });
            }
        });
        
        // Third pass: process each character
        let successCount = 0;
        let errorCount = 0;
        
        characters.forEach((character, index) => {
            try {
                if (this.validateCharacter(character)) {
                    // Set creation time
                    character.createdAt = new Date().toISOString();
                    
                    // Ensure all required fields exist
                    character.disadvantages = character.disadvantages || [];
                    character.banes = character.banes || [];
                    character.feats = character.feats || [];
                    character.usedFeatPoints = character.usedFeatPoints || 0;
                    character.wealthScore = character.wealthScore || 0;
                    character.wealthUsed = character.wealthUsed || false;
                    character.charDescription = character.charDescription || '';
                    character.charBackground = character.charBackground || '';
                    
                    // Migrate legacy fields
                    this.migrateLegacyFields(character);
                    
                    // Reconstruct full data from database
                    this.reconstructCharacterFromExport(character);
                    
                    // Add to characters array
                    this.characters.push(character);
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (error) {
                console.error(`Error processing character at index ${index}:`, error);
                errorCount++;
            }
        });
        
        // Save and update display
        this.saveCharacters();
        this.updateCharacterGrid();
        this.closeModal(document.getElementById('importModal'));
        this.clearFileSelection();
        
        if (successCount > 0) {
            const hierarchyNames = characters.map(char => {
                if (char.isAlternateForm) {
                    return `${char.name} (Tier ${char.alternateFormTier} Alternate Form)`;
                } else if (char.isCompanion) {
                    return `${char.name} (Tier ${char.companionTier} Companion)`;
                } else {
                    return char.name;
                }
            });
            this.showNotification(`Successfully imported character hierarchy: ${hierarchyNames.join(' → ')}`, 'success');
        }
        
        if (errorCount > 0) {
            this.showNotification(`${errorCount} character(s) failed to import.`, 'error');
        }
    }

    // Process imported character (shared logic)
    processImportedCharacter(character) {
        console.log('Processing imported character:', character);
        console.log('Character name:', character.name);
        console.log('Character attributes:', character.attributes);
        console.log('Character keys:', Object.keys(character));

        character.id = Date.now().toString();
        character.createdAt = new Date().toISOString();

        // Ensure all required fields exist
        character.disadvantages = character.disadvantages || [];
        character.banes = character.banes || [];
        character.feats = character.feats || [];

        // Migrate old featPoints property to usedFeatPoints if needed
        if (character.featPoints !== undefined && character.usedFeatPoints === undefined) {
            character.usedFeatPoints = character.featPoints;
            delete character.featPoints;
        }
        character.usedFeatPoints = character.usedFeatPoints || 0;
        character.wealthScore = character.wealthScore || 0;
        character.wealthUsed = character.wealthUsed || false;

        character.charDescription = character.charDescription || '';
        character.charBackground = character.charBackground || '';

        // Migrate legacy perk1, perk2, flaw1, flaw2 fields to arrays
        this.migrateLegacyFields(character);

        // Reconstruct full data from database for imported characters
        this.reconstructCharacterFromExport(character);

        this.characters.push(character);
        this.saveCharacters();
        this.updateCharacterGrid();
        this.closeModal(document.getElementById('importModal'));
        this.clearFileSelection();

        this.showNotification(`Character "${character.name}" imported successfully!`, 'success');
    }

    // Import character from text input
    importCharacter() {
        const importData = document.getElementById('importData').value.trim();
        
        if (!importData) {
            this.showNotification('Please enter character data to import.', 'error');
            return;
        }
        
        try {
            const data = JSON.parse(importData);
            this.processImportedData(data);
        } catch (error) {
            this.showNotification('Invalid character data format. Please check your data.', 'error');
        }
    }

    // Export characters
    exportCharacters() {
        if (this.characters.length === 0) {
            this.showNotification('No characters to export.', 'error');
            return;
        }
        
        this.showExportModal();
    }

    // Show export modal with options
    showExportModal() {
        const cleanedCharacters = this.characters.map(character => this.cleanCharacterForExport(character));
        const exportData = JSON.stringify(cleanedCharacters, null, 2);
        
        // Create modal HTML
        const modalHTML = `
            <div id="exportModal" class="modal" style="display: block;">
                <div class="modal-content">
                    <span class="close" onclick="window.app.closeExportModal()">&times;</span>
                    <h2>Export Characters</h2>
                    
                    <!-- Download Section -->
                    <div class="export-section">
                        <h3><i class="fas fa-download"></i> Download as File</h3>
                        <p>Download your characters as a JSON file to save on your device.</p>
                        <button id="downloadExportBtn" class="btn btn-primary">
                            <i class="fas fa-download"></i> Download JSON File
                        </button>
                    </div>
                    
                    <!-- Divider -->
                    <div class="export-divider">
                        <span>or</span>
                    </div>
                    
                    <!-- Copy as Text Section -->
                    <div class="export-section">
                        <h3><i class="fas fa-copy"></i> Copy as Text</h3>
                        <p>Copy the character data to your clipboard for easy sharing or pasting.</p>
                        <textarea id="exportDataText" readonly rows="8" style="width: 100%; margin-bottom: 15px; font-family: monospace; resize: vertical;">${exportData}</textarea>
                        <button id="copyExportBtn" class="btn btn-secondary">
                            <i class="fas fa-copy"></i> Copy to Clipboard
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Setup event listeners
        document.getElementById('downloadExportBtn').addEventListener('click', () => this.downloadExport(exportData));
        document.getElementById('copyExportBtn').addEventListener('click', () => this.copyExportToClipboard(exportData));
        
        // Close modal when clicking outside
        const exportModal = document.getElementById('exportModal');
        exportModal.addEventListener('click', (e) => {
            if (e.target === exportModal) {
                this.closeExportModal();
            }
        });
    }

    // Download export as file
    downloadExport(exportData) {
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'open_legend_characters.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Characters exported successfully!', 'success');
        this.closeExportModal();
    }

    // Copy export to clipboard
    copyExportToClipboard(exportData) {
        navigator.clipboard.writeText(exportData).then(() => {
            this.showNotification('Character data copied to clipboard!', 'success');
        }).catch(err => {
            // Fallback for older browsers
            const textArea = document.getElementById('exportDataText');
            textArea.select();
            try {
                document.execCommand('copy');
                this.showNotification('Character data copied to clipboard!', 'success');
            } catch (fallbackErr) {
                this.showNotification('Failed to copy to clipboard. Please select and copy the text manually.', 'error');
            }
        });
    }

    // Close export modal
    closeExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.remove();
        }
    }

    // Export a single character
    exportSingleCharacter(characterId) {
        const character = this.characters.find(c => c.id === characterId);
        if (!character) {
            this.showNotification('Character not found.', 'error');
            return;
        }
        
        // Get the entire hierarchy (character + all alternate forms)
        const hierarchyCharacters = this.getAllCharactersInHierarchy(character);
        
        this.showSingleCharacterExportModal(character, hierarchyCharacters);
    }

    // Show export modal for a single character
    showSingleCharacterExportModal(character, hierarchyCharacters = null) {
        // If hierarchyCharacters is provided, export the entire hierarchy
        if (hierarchyCharacters && hierarchyCharacters.length > 1) {
            const cleanedHierarchy = hierarchyCharacters.map(char => this.cleanCharacterForExport(char));
            const exportData = JSON.stringify(cleanedHierarchy, null, 2);
            
            // Update the modal to show hierarchy information
            this.showSingleCharacterExportModalWithHierarchy(character, exportData, hierarchyCharacters);
            return;
        }
        
        // Single character export (original behavior)
        const cleanedCharacter = this.cleanCharacterForExport(character);
        const exportData = JSON.stringify(cleanedCharacter, null, 2);
        
        // Create modal HTML
        const modalHTML = `
            <div id="singleExportModal" class="modal" style="display: block;">
                <div class="modal-content">
                    <span class="close" onclick="window.app.closeSingleCharacterExportModal()">&times;</span>
                    <h2>Export Character: ${character.name}</h2>
                    
                    <!-- Download Section -->
                    <div class="export-section">
                        <h3><i class="fas fa-download"></i> Download as File</h3>
                        <p>Download ${character.name} in different formats:</p>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button id="downloadSingleExportBtn" class="btn btn-primary">
                                <i class="fas fa-download"></i> Download JSON
                            </button>
                            <button id="downloadSinglePdfBtn" class="btn btn-info">
                                <i class="fas fa-file-pdf"></i> Download PDF
                            </button>
                        </div>
                    </div>
                    
                    <!-- Divider -->
                    <div class="export-divider">
                        <span>or</span>
                    </div>
                    
                    <!-- Copy as Text Section -->
                    <div class="export-section">
                        <h3><i class="fas fa-copy"></i> Copy as Text</h3>
                        <p>Copy ${character.name}'s data to your clipboard for easy sharing or pasting.</p>
                        <textarea id="singleExportDataText" readonly rows="8" style="width: 100%; margin-bottom: 15px; font-family: monospace; resize: vertical;">${exportData}</textarea>
                        <button id="copySingleExportBtn" class="btn btn-secondary">
                            <i class="fas fa-copy"></i> Copy to Clipboard
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Setup event listeners
        document.getElementById('downloadSingleExportBtn').addEventListener('click', () => this.downloadSingleCharacterExport(exportData, character.name));
        document.getElementById('downloadSinglePdfBtn').addEventListener('click', () => this.downloadSingleCharacterPDF(character));
        document.getElementById('copySingleExportBtn').addEventListener('click', () => this.copySingleCharacterExportToClipboard(exportData, character.name));
        
        // Close modal when clicking outside
        const singleExportModal = document.getElementById('singleExportModal');
        singleExportModal.addEventListener('click', (e) => {
            if (e.target === singleExportModal) {
                this.closeSingleCharacterExportModal();
            }
        });
    }

    // Show export modal for a character with its hierarchy
    showSingleCharacterExportModalWithHierarchy(character, exportData, hierarchyCharacters) {
        // Create hierarchy description
        const hierarchyNames = hierarchyCharacters.map(char => {
            if (char.isAlternateForm) {
                return `${char.name} (Tier ${char.alternateFormTier} Alternate Form)`;
            } else if (char.isCompanion) {
                return `${char.name} (Tier ${char.companionTier} Companion)`;
            } else {
                return char.name;
            }
        });
        const hierarchyDescription = hierarchyNames.join(' → ');
        
        // Create modal HTML
        const modalHTML = `
            <div id="singleExportModal" class="modal" style="display: block;">
                <div class="modal-content">
                    <span class="close" onclick="window.app.closeSingleCharacterExportModal()">&times;</span>
                    <h2>Export Character Hierarchy: ${character.name}</h2>
                    
                    <div class="hierarchy-info" style="background: #f0f8ff; padding: 10px; border-radius: 5px; margin: 10px 0;">
                        <h4><i class="fas fa-sitemap"></i> Character Hierarchy</h4>
                        <p><strong>${hierarchyNames.length} characters</strong> will be exported:</p>
                        <p style="font-family: monospace; color: #666;">${hierarchyDescription}</p>
                    </div>
                    
                    <!-- Download Section -->
                    <div class="export-section">
                        <h3><i class="fas fa-download"></i> Download as File</h3>
                        <p>Download the entire character hierarchy in different formats:</p>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button id="downloadSingleExportBtn" class="btn btn-primary">
                                <i class="fas fa-download"></i> Download JSON
                            </button>
                            <button id="downloadSinglePdfBtn" class="btn btn-info">
                                <i class="fas fa-file-pdf"></i> Download PDF
                            </button>
                        </div>
                    </div>
                    
                    <!-- Divider -->
                    <div class="export-divider">
                        <hr>
                        <span>or</span>
                        <hr>
                    </div>
                    
                    <!-- Copy Section -->
                    <div class="export-section">
                        <h3><i class="fas fa-copy"></i> Copy to Clipboard</h3>
                        <p>Copy the JSON data to your clipboard to share or backup:</p>
                        <button id="copySingleExportBtn" class="btn btn-secondary">
                            <i class="fas fa-copy"></i> Copy to Clipboard
                        </button>
                    </div>
                    
                    <!-- JSON Preview -->
                    <div class="export-section">
                        <h3><i class="fas fa-code"></i> JSON Preview</h3>
                        <p>Preview of the exported data (first 500 characters):</p>
                        <textarea id="singleExportDataText" readonly style="width: 100%; height: 150px; font-family: monospace; font-size: var(--font-size-sm);">${exportData.substring(0, 500)}${exportData.length > 500 ? '...' : ''}</textarea>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Setup event listeners
        document.getElementById('downloadSingleExportBtn').addEventListener('click', () => this.downloadSingleCharacterExport(exportData, character.name + '_hierarchy'));
        document.getElementById('downloadSinglePdfBtn').addEventListener('click', () => this.downloadSingleCharacterPDF(character));
        document.getElementById('copySingleExportBtn').addEventListener('click', () => this.copySingleCharacterExportToClipboard(exportData, character.name + '_hierarchy'));
        
        // Close modal when clicking outside
        const singleExportModal = document.getElementById('singleExportModal');
        singleExportModal.addEventListener('click', (e) => {
            if (e.target === singleExportModal) {
                this.closeSingleCharacterExportModal();
            }
        });
    }

    // Download single character export as file
    downloadSingleCharacterExport(exportData, characterName) {
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `open_legend_${characterName.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification(`Character "${characterName}" exported successfully!`, 'success');
        this.closeSingleCharacterExportModal();
    }

    // Copy single character export to clipboard
    copySingleCharacterExportToClipboard(exportData, characterName) {
        navigator.clipboard.writeText(exportData).then(() => {
            this.showNotification(`Character "${characterName}" copied to clipboard!`, 'success');
        }).catch(err => {
            // Fallback for older browsers
            const textArea = document.getElementById('singleExportDataText');
            textArea.select();
            try {
                document.execCommand('copy');
                this.showNotification(`Character "${characterName}" copied to clipboard!`, 'success');
            } catch (fallbackErr) {
                this.showNotification('Failed to copy to clipboard. Please select and copy the text manually.', 'error');
            }
        });
    }

    // Get effective attribute score for PDF (considering equipped items that boost attributes)
    getEffectiveAttributeScoreForPDF(character, attributeName) {
        if (!character) return 0;
        
        // Get base attribute score
        const baseScore = character.attributes?.[attributeName] || 0;
        
        // Check for equipment bonuses
        let equipmentBonus = 0;
        if (character.equipment && character.equipment.length > 0) {
            character.equipment.forEach(item => {
                if (item.equipped && item.attributeBonuses && item.attributeBonuses[attributeName]) {
                    equipmentBonus += item.attributeBonuses[attributeName];
                }
            });
        }
        
        return baseScore + equipmentBonus;
    }

    // Get available boons for PDF (filtered based on character attributes)
    getAvailableBoonsForPDF(character) {
        if (!character || !window.GAME_DATABASE || !window.GAME_DATABASE.boons) return [];
        
        const availableBoons = [];
        
        window.GAME_DATABASE.boons.forEach(boon => {
            // Check if character has any of the required attributes at sufficient level
            const hasRequiredAttribute = boon.attributes.some(attributeName => {
                const attributeScore = this.getEffectiveAttributeScoreForPDF(character, attributeName);
                
                // Check if any power level is accessible
                const hasAccessiblePowerLevel = boon.powerLevels.some(powerLevel => {
                    return attributeScore >= powerLevel;
                });
                
                return hasAccessiblePowerLevel;
            });
            
            if (hasRequiredAttribute) {
                availableBoons.push(boon);
            }
        });
        
        // Also include persistent and reliable boons from equipment
        if (character.availableBoons && character.availableBoons.length > 0) {
            const persistentBoons = character.availableBoons.filter(boon => boon.isPersistent);
            const reliableBoons = character.availableBoons.filter(boon => boon.isReliable);
            availableBoons.push(...persistentBoons, ...reliableBoons);
        }
        
        return availableBoons;
    }

    // Get available banes for PDF (filtered based on character attributes)
    getAvailableBanesForPDF(character) {
        if (!character || !window.GAME_DATABASE || !window.GAME_DATABASE.banes) return [];
        
        const availableBanes = [];
        
        window.GAME_DATABASE.banes.forEach(bane => {
            // Check if character has any of the required attributes at sufficient level
            const hasRequiredAttribute = bane.attributes.some(attributeName => {
                const attributeScore = this.getEffectiveAttributeScoreForPDF(character, attributeName);
                
                // Check if any power level is accessible
                const hasAccessiblePowerLevel = bane.powerLevels.some(powerLevel => {
                    return attributeScore >= powerLevel;
                });
                
                return hasAccessiblePowerLevel;
            });
            
            if (hasRequiredAttribute) {
                availableBanes.push(bane);
            }
        });
        
        // Also include cursed banes from equipment
        if (character.availableBanes && character.availableBanes.length > 0) {
            const cursedBanes = character.availableBanes.filter(bane => bane.isCursed);
            availableBanes.push(...cursedBanes);
        }
        
        return availableBanes;
    }

    // Download single character as PDF
    downloadSingleCharacterPDF(character) {
        try {
            // Initialize PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Set up fonts and styling
            doc.setFont('helvetica');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 10;
            const colWidth = (pageWidth - 4 * margin) / 3;
            const col1X = margin;
            const col2X = margin + colWidth + margin;
            const col3X = margin + 2 * (colWidth + margin);
            let yPosition = margin;
            
            // Helper function to add text with word wrapping
            const addText = (text, x, y, maxWidth, fontSize = 9, style = 'normal', color = 'black') => {
                doc.setFontSize(fontSize);
                doc.setFont('helvetica', style);
                doc.setTextColor(color);
                const lines = doc.splitTextToSize(text, maxWidth);
                doc.text(lines, x, y);
                return y + (lines.length * fontSize * 0.35) + 2;
            };
            
            // Helper function to add a section header
            const addSectionHeader = (title, x, y, width) => {
                y = addText(title, x, y, width, 11, 'bold', '#2c3e50');
                doc.setLineWidth(0.3);
                doc.setDrawColor(44, 62, 80);
                doc.line(x, y + 1, x + width, y + 1);
                return y + 4;
            };
            
            // Helper function to add a stat box
            const addStatBox = (label, value, x, y, width, isEditable = false) => {
                const boxHeight = 10;
                const labelY = y + 1.5;
                const valueY = y + 6.5;
                
                // Draw box
                doc.setLineWidth(0.2);
                doc.setDrawColor(200, 200, 200);
                doc.rect(x, y, width, boxHeight);
                
                // Add label
                addText(label, x + 2, labelY, width - 4, 6, 'normal', '#666');
                
                // Add value
                if (isEditable) {
                    // Draw inner rectangle for editable field
                    doc.setLineWidth(0.1);
                    doc.setDrawColor(100, 100, 100);
                    doc.rect(x + 2, valueY - 5, width - 4, 5);
                }
                addText(value.toString(), x + 3, valueY, width - 6, 7, 'bold', '#000');
                
                return y + boxHeight + 1;
            };
            
            // Helper function to add a list item
            const addListItem = (text, x, y, width, fontSize = 8) => {
                const result = addText(`• ${text}`, x, y, width, fontSize, 'normal');
                return result + 1; // Add extra spacing after list items
            };
            
            // Helper function to add equipment text with reduced margins
            const addEquipmentText = (text, x, y, width, fontSize = 6, style = 'normal', color = '#666') => {
                doc.setFontSize(fontSize);
                doc.setFont('helvetica', style);
                doc.setTextColor(color);
                const lines = doc.splitTextToSize(text, width);
                doc.text(lines, x, y);
                return y + (lines.length * fontSize * 0.35) + 0.5; // Reduced margin for equipment
            };
            
            // Helper function to check if we need a new page
            const checkNewPage = (requiredSpace) => {
                if (yPosition + requiredSpace > pageHeight - margin) {
                    doc.addPage();
                    yPosition = margin;
                    return true;
                }
                return false;
            };
            
            // Character Header
            yPosition = addText(`${character.name}`, pageWidth/2 - 50, yPosition, 100, 16, 'bold', '#2c3e50');
            yPosition = addText(`Level ${character.level || 1} | XP: ${character.expPoints || 0}`, pageWidth/2 - 40, yPosition, 80, 10, 'normal', '#666');
            yPosition = addText(`${character.archetype || 'No Archetype'}`, pageWidth/2 - 30, yPosition, 60, 9, 'italic', '#888');
            yPosition += 10;
            
            // Character Description Section (Full Width) - MOVED TO PAGE 3
            // DISABLED - Now on Page 3
            if (false && (character.description || character.background || character.notes || character.image)) {
                yPosition = addSectionHeader('Character Description', margin, yPosition, pageWidth - 2 * margin);
                
                // Character Image
                if (character.image) {
                    yPosition = addText('Character Image:', margin, yPosition, pageWidth - 2 * margin, 9, 'bold', '#2c3e50');
                    yPosition = addText('[Character Image would appear here]', margin + 10, yPosition, pageWidth - 2 * margin - 10, 8, 'italic', '#999');
                    yPosition += 5;
                }
                
                if (character.description) {
                    yPosition = addText('Description:', margin, yPosition, pageWidth - 2 * margin, 9, 'bold', '#2c3e50');
                    yPosition = addText(character.description, margin + 10, yPosition, pageWidth - 2 * margin - 10, 8, 'normal');
                    yPosition += 5;
                }
                
                if (character.background) {
                    yPosition = addText('Background Story:', margin, yPosition, pageWidth - 2 * margin, 9, 'bold', '#2c3e50');
                    yPosition = addText(character.background, margin + 10, yPosition, pageWidth - 2 * margin - 10, 8, 'normal');
                    yPosition += 5;
                }
                
                if (character.notes) {
                    yPosition = addText('Additional Notes:', margin, yPosition, pageWidth - 2 * margin, 9, 'bold', '#2c3e50');
                    yPosition = addText(character.notes, margin + 10, yPosition, pageWidth - 2 * margin - 10, 8, 'normal');
                    yPosition += 5;
                }
                
                yPosition += 10;
            }
            
            // Calculate combat stats
            const agility = character.attributes?.agility || 0;
            const might = character.attributes?.might || 0;
            const fortitude = character.attributes?.fortitude || 0;
            const will = character.attributes?.will || 0;
            const presence = character.attributes?.presence || 0;
            
            const armorBonus = this.getEquipmentBonus ? this.getEquipmentBonus('armor') : 0;
            const featBonus = this.getFeatBonus ? this.getFeatBonus('guard') : 0;
            const boonsBanesBonus = this.getBoonsBanesBonus ? this.getBoonsBanesBonus('guard') : 0;
            
            const guard = 10 + agility + might + armorBonus + featBonus + boonsBanesBonus;
            const toughness = 10 + fortitude + will + (this.getFeatBonus ? this.getFeatBonus('toughness') : 0) + (this.getBoonsBanesBonus ? this.getBoonsBanesBonus('toughness') : 0);
            const resolve = 10 + presence + will + (this.getFeatBonus ? this.getFeatBonus('resolve') : 0) + (this.getBoonsBanesBonus ? this.getBoonsBanesBonus('resolve') : 0);
            
            // COLUMN 1: Basic Stats
            let col1Y = yPosition;
            col1Y = addSectionHeader('Combat Stats', col1X, col1Y, colWidth);
            col1Y = addStatBox('Guard', guard, col1X, col1Y, colWidth, true);
            col1Y = addStatBox('Toughness', toughness, col1X, col1Y, colWidth, true);
            col1Y = addStatBox('Resolve', resolve, col1X, col1Y, colWidth, true);
            col1Y += 5;
            
            col1Y = addSectionHeader('Health & Movement', col1X, col1Y, colWidth);
            col1Y = addStatBox('Current HP', character.currentHP || character.maxHP || 0, col1X, col1Y, colWidth, true);
            col1Y = addStatBox('Max HP', character.baseMaxHP || 0, col1X, col1Y, colWidth, true);
            col1Y = addStatBox('Current Lethal', character.lethalDamage || 0, col1X, col1Y, colWidth, true);
            col1Y += 5;
            
            col1Y = addSectionHeader('Movement', col1X, col1Y, colWidth);
            
            // Calculate effective movement speed (same logic as updateMovementStats)
            const baseMovementSpeed = character.movementSpeed || 30;
            let effectiveMovementSpeed = baseMovementSpeed;
            
            
            let fleetOfFootBonus = 0;
            const fleetOfFootFeat = character.feats && character.feats.find(feat => feat.name === 'Fleet of Foot');
            if (fleetOfFootFeat && fleetOfFootFeat.tier) {
                fleetOfFootBonus = fleetOfFootFeat.tier * 5; // +5 per tier
            }
            
            
            const totalBaseSpeed = baseMovementSpeed + fleetOfFootBonus;
            
            // Check if equipped armor has speed reduction
            const equippedArmor = character.equipment && character.equipment.find(e => e.equipped && e.type === 'armor');
            let movementPenalty = 0;
            if (equippedArmor && equippedArmor.speedReduction) {
                movementPenalty = 5; // Default penalty
                
                // Armor Mastery Tier 2 reduces movement penalty by 5'
                const armorMasteryFeat = character.feats && character.feats.find(feat => feat.name === 'Armor Mastery');
                if (armorMasteryFeat && armorMasteryFeat.tier >= 2) {
                    movementPenalty = Math.max(0, movementPenalty - 5);
                }
                
                effectiveMovementSpeed = Math.max(0, totalBaseSpeed - movementPenalty);
            } else {
                effectiveMovementSpeed = totalBaseSpeed;
            }
            
            col1Y = addStatBox('Ground Speed', `${effectiveMovementSpeed} ft`, col1X, col1Y, colWidth, true);
            
            // Calculate climbing speed
            let climbingSpeed;
            if (character.feats && character.feats.some(feat => feat.name === 'Climbing')) {
                climbingSpeed = effectiveMovementSpeed;
            } else {
                climbingSpeed = Math.floor(effectiveMovementSpeed / 2);
            }
            col1Y = addStatBox('Climbing', `${climbingSpeed} ft`, col1X, col1Y, colWidth, true);
            
            // Calculate swimming speed
            let swimmingSpeed;
            if (character.feats && character.feats.some(feat => feat.name === 'Swimming')) {
                swimmingSpeed = effectiveMovementSpeed;
            } else {
                swimmingSpeed = Math.floor(effectiveMovementSpeed / 2);
            }
            col1Y = addStatBox('Swimming', `${swimmingSpeed} ft`, col1X, col1Y, colWidth, true);
            
            // Calculate flying speed
            const hasFlyingFeat = character.feats && character.feats.some(feat => feat.name === 'Flying');
            const flightBoon = character.boons && character.boons.find(boon => boon.name === 'Flight');
            const hasFlightBoon = !!flightBoon;
            
            let flyingSpeed = 0;
            if (hasFlyingFeat || hasFlightBoon) {
                if (hasFlightBoon && flightBoon.powerLevel) {
                    // Flight boon: speed depends on power level
                    switch (flightBoon.powerLevel) {
                        case 5:
                            flyingSpeed = 10;
                            break;
                        case 6:
                            flyingSpeed = 30;
                            break;
                        case 8:
                            flyingSpeed = 60;
                            break;
                        default:
                            flyingSpeed = effectiveMovementSpeed; // fallback
                    }
                } else if (hasFlyingFeat) {
                    // Flying feat: speed equals movement speed
                    flyingSpeed = effectiveMovementSpeed;
                } else {
                    // Fallback: speed equals movement speed
                    flyingSpeed = effectiveMovementSpeed;
                }
            }
            col1Y = addStatBox('Flying', `${flyingSpeed} ft`, col1X, col1Y, colWidth, true);
            col1Y += 5;
            
            col1Y = addSectionHeader('Combat', col1X, col1Y, colWidth);
            // Initiative equals Agility score
            const initiative = character.attributes?.agility || 0;
            col1Y = addStatBox('Initiative', initiative, col1X, col1Y, colWidth, true);
            col1Y = addStatBox('Legend Points', character.legendPoints || 0, col1X, col1Y, colWidth, true);
            
            // COLUMN 2: Attributes
            let col2Y = yPosition;
            col2Y = addSectionHeader('Attributes', col2X, col2Y, colWidth);
            
            // Physical Attributes
            col2Y = addText('Physical', col2X, col2Y, colWidth, 8, 'bold', '#666');
            col2Y += 2;
            const physicalAttrs = ['Agility', 'Fortitude', 'Might'];
            physicalAttrs.forEach(attr => {
                const attrKey = attr.toLowerCase();
                const value = character.attributes?.[attrKey] || 0;
                const dice = this.calculateAttributeDice(value, attrKey);
                col2Y = addStatBox(attr, `${value} (${dice})`, col2X, col2Y, colWidth);
            });
            
            col2Y += 2;
            // Mental Attributes
            col2Y = addText('Mental', col2X, col2Y, colWidth, 8, 'bold', '#666');
            col2Y += 1;
            const mentalAttrs = ['Learning', 'Logic', 'Perception', 'Will'];
            mentalAttrs.forEach(attr => {
                const attrKey = attr.toLowerCase();
                const value = character.attributes?.[attrKey] || 0;
                const dice = this.calculateAttributeDice(value, attrKey);
                col2Y = addStatBox(attr, `${value} (${dice})`, col2X, col2Y, colWidth);
            });
            
            col2Y += 2;
            // Social Attributes
            col2Y = addText('Social', col2X, col2Y, colWidth, 8, 'bold', '#666');
            col2Y += 1;
            const socialAttrs = ['Deception', 'Persuasion', 'Presence'];
            socialAttrs.forEach(attr => {
                const attrKey = attr.toLowerCase();
                const value = character.attributes?.[attrKey] || 0;
                const dice = this.calculateAttributeDice(value, attrKey);
                col2Y = addStatBox(attr, `${value} (${dice})`, col2X, col2Y, colWidth);
            });
            
            col2Y += 2;
            // Extraordinary Attributes
            col2Y = addText('Extraordinary', col2X, col2Y, colWidth, 8, 'bold', '#666');
            col2Y += 1;
            const extraordinaryAttrs = ['Alteration', 'Creation', 'Energy', 'Entropy', 'Influence', 'Movement', 'Prescience', 'Protection'];
            extraordinaryAttrs.forEach(attr => {
                const attrKey = attr.toLowerCase();
                const value = character.attributes?.[attrKey] || 0;
                const dice = this.calculateAttributeDice(value, attrKey);
                col2Y = addStatBox(attr, `${value} (${dice})`, col2X, col2Y, colWidth);
            });
            
            // COLUMN 3: Equipment
            let col3Y = yPosition;
            col3Y = addSectionHeader('Equipment', col3X, col3Y, colWidth);
            
            if (character.equipment && character.equipment.length > 0) {
                character.equipment.forEach(item => {
                    const equipped = item.equipped ? ' (E)' : '';
                    col3Y = addListItem(`${item.name}${equipped}`, col3X, col3Y, colWidth, 7);
                    
                    // Equipment type
                    if (item.type) {
                        col3Y = addEquipmentText(`  Type: ${item.type}`, col3X, col3Y, colWidth, 6, 'italic', '#666');
                    }
                    
                    // Armor-specific attributes
                    if (item.type === 'armor') {
                        if (item.armorDefense) {
                            col3Y = addEquipmentText(`  Armor Defense: +${item.armorDefense}`, col3X, col3Y, colWidth, 6, 'normal', '#666');
                        }
                        if (item.requiredFortitude) {
                            col3Y = addEquipmentText(`  Required Fortitude: ${item.requiredFortitude}`, col3X, col3Y, colWidth, 6, 'normal', '#666');
                        }
                        if (item.speedReduction) {
                            col3Y = addEquipmentText(`  Speed Reduction: Yes`, col3X, col3Y, colWidth, 6, 'normal', '#666');
                        }
                    }
                    
                    // Weapon-specific attributes
                    if (item.type === 'weapon') {
                        if (item.weaponCategory) {
                            col3Y = addEquipmentText(`  Category: ${item.weaponCategory}`, col3X, col3Y, colWidth, 6, 'normal', '#666');
                        }
                        if (item.rangeIncrement) {
                            col3Y = addEquipmentText(`  Range: ${item.rangeIncrement}`, col3X, col3Y, colWidth, 6, 'normal', '#666');
                        }
                        if (item.properties && item.properties.length > 0) {
                            const propertiesText = item.properties.join(', ');
                            col3Y = addEquipmentText(`  Properties: ${propertiesText}`, col3X, col3Y, colWidth, 6, 'normal', '#666');
                        }
                        if (item.defensiveValue) {
                            col3Y = addEquipmentText(`  Defensive Value: ${item.defensiveValue}`, col3X, col3Y, colWidth, 6, 'normal', '#666');
                        }
                        if (item.deadlyValue) {
                            col3Y = addEquipmentText(`  Deadly Value: ${item.deadlyValue}`, col3X, col3Y, colWidth, 6, 'normal', '#666');
                        }
                        if (item.damageType) {
                            col3Y = addEquipmentText(`  Damage Type: ${item.damageType}`, col3X, col3Y, colWidth, 6, 'normal', '#666');
                        }
                        if (item.banefulBane) {
                            col3Y = addEquipmentText(`  Baneful: ${item.banefulBane}`, col3X, col3Y, colWidth, 6, 'normal', '#666');
                        }
                    }
                    
                    // Universal properties
                    if (item.universalProperties && item.universalProperties.length > 0) {
                        const universalProps = item.universalProperties.join(', ');
                        col3Y = addEquipmentText(`  Universal Properties: ${universalProps}`, col3X, col3Y, colWidth, 6, 'normal', '#666');
                    }
                    
                    // Wealth level
                    if (item.wealthLevel) {
                        col3Y = addEquipmentText(`  Wealth Level: ${item.wealthLevel}`, col3X, col3Y, colWidth, 6, 'normal', '#666');
                    }
                    
                    // Equipment effects/description
                    if (item.effects) {
                        col3Y = addEquipmentText(`  ${item.effects}`, col3X, col3Y, colWidth, 6, 'normal', '#666');
                    }
                    
                    col3Y += 0.5;
                });
            } else {
                col3Y = addText('No equipment', col3X, col3Y, colWidth, 7, 'italic', '#999');
            }
            
            col3Y += 3;
            // Actions (without header)
            if (character.actions && character.actions.length > 0) {
                character.actions.forEach(action => {
                    col3Y = addListItem(action.name, col3X, col3Y, colWidth, 7);
                    if (action.actionDuration) {
                        col3Y = addText(`  ${action.actionDuration}`, col3X, col3Y, colWidth, 6, 'italic', '#666');
                    }
                    col3Y += 0.5;
                });
            }
            
            // Update yPosition to the highest column
            yPosition = Math.max(col1Y, col2Y, col3Y) + 10;
            
            // Second Row: Feats, Perks, Flaws
            checkNewPage(100);
            yPosition = Math.max(yPosition, margin);
            
            // COLUMN 1: Feats
            col1Y = yPosition;
            col1Y = addSectionHeader('Feats', col1X, col1Y, colWidth);
            
            if (character.feats && character.feats.length > 0) {
                character.feats.forEach(feat => {
                    col1Y = addListItem(feat.name, col1X, col1Y, colWidth, 8);
                    // Get description from database
                    let description = '';
                    if (window.GAME_DATABASE && window.GAME_DATABASE.feats) {
                        const databaseFeat = window.GAME_DATABASE.feats.find(f => f.name === feat.name);
                        if (databaseFeat && databaseFeat.description) {
                            description = databaseFeat.description;
                        }
                    }
                    if (!description && feat.customDetails) {
                        description = feat.customDetails;
                    }
                    if (description) {
                        col1Y = addText(`  ${description}`, col1X, col1Y, colWidth, 6, 'normal', '#666');
                    }
                    col1Y += 1;
                });
            } else {
                col1Y = addText('No feats', col1X, col1Y, colWidth, 7, 'italic', '#999');
            }
            
            // COLUMN 2: Perks
            col2Y = yPosition;
            col2Y = addSectionHeader('Perks', col2X, col2Y, colWidth);
            
            if (character.perks && character.perks.length > 0) {
                character.perks.forEach(perk => {
                    col2Y = addListItem(perk.name, col2X, col2Y, colWidth, 8);
                    // Get description from database
                    let description = '';
                    if (window.GAME_DATABASE && window.GAME_DATABASE.perks) {
                        const databasePerk = window.GAME_DATABASE.perks.find(p => p.name === perk.name);
                        if (databasePerk && databasePerk.description) {
                            description = databasePerk.description;
                        }
                    }
                    if (description) {
                        col2Y = addText(`  ${description}`, col2X, col2Y, colWidth, 6, 'normal', '#666');
                    }
                    col2Y += 1;
                });
            } else {
                col2Y = addText('No perks', col2X, col2Y, colWidth, 7, 'italic', '#999');
            }
            
            // COLUMN 3: Flaws
            col3Y = yPosition;
            col3Y = addSectionHeader('Flaws', col3X, col3Y, colWidth);
            
            if (character.flaws && character.flaws.length > 0) {
                character.flaws.forEach(flaw => {
                    col3Y = addListItem(flaw.name, col3X, col3Y, colWidth, 8);
                    // Get description from database
                    let description = '';
                    if (window.GAME_DATABASE && window.GAME_DATABASE.flaws) {
                        const databaseFlaw = window.GAME_DATABASE.flaws.find(f => f.name === flaw.name);
                        if (databaseFlaw && databaseFlaw.description) {
                            description = databaseFlaw.description;
                        }
                    }
                    if (description) {
                        col3Y = addText(`  ${description}`, col3X, col3Y, colWidth, 6, 'normal', '#666');
                    }
                    col3Y += 1;
                });
            } else {
                col3Y = addText('No flaws', col3X, col3Y, colWidth, 7, 'italic', '#999');
            }
            
            yPosition = Math.max(col1Y, col2Y, col3Y) + 10;
            
            // Third Row: Available Boons & Banes (2 columns for better width utilization)
            checkNewPage(150);
            yPosition = Math.max(yPosition, margin);
            
            // Calculate wider column width for 2-column layout
            const wideColWidth = (pageWidth - 3 * margin) / 2;
            const wideCol1X = margin;
            const wideCol2X = margin + wideColWidth + margin;
            
            // COLUMN 1: Available Boons
            col1Y = yPosition;
            col1Y = addSectionHeader('Available Boons', wideCol1X, col1Y, wideColWidth);
            
            // Debug logging
            console.log('PDF Debug - GameDatabase:', !!window.GAME_DATABASE);
            console.log('PDF Debug - Boons:', window.GAME_DATABASE?.boons?.length || 0);
            console.log('PDF Debug - Character data:', character);
            console.log('PDF Debug - Character attributes:', character.attributes);
            
            // Get filtered available boons (same logic as main application)
            const availableBoons = this.getAvailableBoonsForPDF(character);
            
            if (availableBoons && availableBoons.length > 0) {
                // Show filtered boons without descriptions to save space
                availableBoons.forEach(boon => {
                    col1Y = addListItem(boon.name, wideCol1X, col1Y, wideColWidth, 7);
                    col1Y += 0.5; // Reduced spacing
                });
            } else {
                col1Y = addText('No boons available', wideCol1X, col1Y, wideColWidth, 7, 'italic', '#999');
            }
            
            // COLUMN 2: Available Banes
            col2Y = yPosition;
            col2Y = addSectionHeader('Available Banes', wideCol2X, col2Y, wideColWidth);
            
            console.log('PDF Debug - Banes:', window.GAME_DATABASE?.banes?.length || 0);
            
            // Get filtered available banes (same logic as main application)
            const availableBanes = this.getAvailableBanesForPDF(character);
            
            if (availableBanes && availableBanes.length > 0) {
                // Show filtered banes without descriptions to save space
                availableBanes.forEach(bane => {
                    col2Y = addListItem(bane.name, wideCol2X, col2Y, wideColWidth, 7);
                    col2Y += 0.5; // Reduced spacing
                });
            } else {
                col2Y = addText('No banes available', wideCol2X, col2Y, wideColWidth, 7, 'italic', '#999');
            }
            
            // No third column needed for this section
            col3Y = yPosition;
            
            yPosition = Math.max(col1Y, col2Y, col3Y) + 10;
            
            // Third Page: Character Description Section
            console.log('PDF Debug - Character description fields:', {
                charDescription: character.charDescription,
                charBackground: character.charBackground,
                charNotes: character.charNotes,
                charImage: character.charImage
            });
            
            // Always create 3rd page for testing
            doc.addPage();
            yPosition = margin;
            
            yPosition = addSectionHeader('Character Description', margin, yPosition, pageWidth - 2 * margin);
            
            // Character Image
            yPosition = addText('Character Image:', margin, yPosition, pageWidth - 2 * margin, 9, 'bold', '#2c3e50');
            yPosition += 5;
            
            if (character.charImage) {
                try {
                    // Add the actual character image
                    const imageWidth = 80;
                    const imageHeight = 80;
                    const imageX = margin;
                    const imageY = yPosition;
                    
                    doc.addImage(character.charImage, 'JPEG', imageX, imageY, imageWidth, imageHeight);
                    yPosition += imageHeight + 5;
                } catch (error) {
                    console.error('Error adding character image to PDF:', error);
                    yPosition = addText('[Error loading character image]', margin, yPosition, pageWidth - 2 * margin, 8, 'italic', '#ff6b6b');
                    yPosition += 5;
                }
            } else {
                yPosition = addText('[No character image]', margin, yPosition, pageWidth - 2 * margin, 8, 'italic', '#999');
                yPosition += 5;
            }
            
            if (character.charDescription) {
                yPosition = addText('Description:', margin, yPosition, pageWidth - 2 * margin, 9, 'bold', '#2c3e50');
                yPosition = addText(character.charDescription, margin + 10, yPosition, pageWidth - 2 * margin - 10, 8, 'normal');
                yPosition += 5;
            } else {
                yPosition = addText('Description:', margin, yPosition, pageWidth - 2 * margin, 9, 'bold', '#2c3e50');
                yPosition = addText('[No description]', margin + 10, yPosition, pageWidth - 2 * margin - 10, 8, 'italic', '#999');
                yPosition += 5;
            }
            
            if (character.charBackground) {
                yPosition = addText('Background Story:', margin, yPosition, pageWidth - 2 * margin, 9, 'bold', '#2c3e50');
                yPosition = addText(character.charBackground, margin + 10, yPosition, pageWidth - 2 * margin - 10, 8, 'normal');
                yPosition += 5;
            } else {
                yPosition = addText('Background Story:', margin, yPosition, pageWidth - 2 * margin, 9, 'bold', '#2c3e50');
                yPosition = addText('[No background story]', margin + 10, yPosition, pageWidth - 2 * margin - 10, 8, 'italic', '#999');
                yPosition += 5;
            }
            
            // Additional Notes (Editable)
            yPosition = addText('Additional Notes:', margin, yPosition, pageWidth - 2 * margin, 9, 'bold', '#2c3e50');
            yPosition += 2;
            
            // Create editable box for notes
            const notesValue = character.charNotes || '';
            const notesBoxHeight = 20;
            doc.rect(margin, yPosition, pageWidth - 2 * margin, notesBoxHeight);
            yPosition = addText(notesValue, margin + 2, yPosition + 6, pageWidth - 2 * margin - 4, 8, 'normal');
            yPosition += notesBoxHeight + 5;
            
            // Generate filename and download
            const filename = `${character.name.replace(/[^a-zA-Z0-9]/g, '_')}_Character_Sheet.pdf`;
            doc.save(filename);
            
            this.showNotification('Character PDF exported successfully!', 'success');
            this.closeSingleCharacterExportModal();
            
        } catch (error) {
            console.error('Error exporting character to PDF:', error);
            this.showNotification('Error exporting to PDF: ' + error.message, 'error');
        }
    }

    // Close single character export modal
    closeSingleCharacterExportModal() {
        const modal = document.getElementById('singleExportModal');
        if (modal) {
            modal.remove();
        }
    }

    // Close modal
    closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '12px',
            color: 'white',
            fontWeight: '600',
            zIndex: '10000',
            maxWidth: '300px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        });
        
        switch(type) {
            case 'success':
                notification.style.background = 'linear-gradient(135deg, #51cf66, #40c057)';
                break;
            case 'error':
                notification.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
                break;
            case 'warning':
                notification.style.background = 'linear-gradient(135deg, #ffd43b, #fcc419)';
                break;
            default:
                notification.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Load characters from localStorage
    loadCharacters() {
        try {
            const saved = localStorage.getItem('openLegendCharacters');
            if (!saved) return [];
            
            const characters = JSON.parse(saved);
            
            // Migrate old featPoints property to usedFeatPoints for all characters
            characters.forEach(character => {
                if (character.featPoints !== undefined && character.usedFeatPoints === undefined) {
                    character.usedFeatPoints = character.featPoints;
                    delete character.featPoints;
                }
                if (character.usedFeatPoints === undefined) {
                    character.usedFeatPoints = 0;
                }
                
                // Ensure archetype field exists
                if (character.archetype === undefined) {
                    character.archetype = '';
                }
                
                            // Migrate old perk1, perk2, flaw1, flaw2 fields to arrays
                this.migrateLegacyFields(character);
                
                // Ensure advantages and disadvantages have count field
                this.migrateAdvantageDisadvantageCounts(character);
            });
            
            return characters;
        } catch (error) {
            console.error('Error loading characters:', error);
            return [];
        }
    }

    // Migrate legacy perk1, perk2, flaw1, flaw2 fields to arrays
    migrateLegacyFields(character) {
        // Migrate old perk1, perk2 fields to perks array
        if (character.perks === undefined) {
            character.perks = [];
        }
        if (character.perk1) {
            character.perks.push({
                name: character.perk1
            });
            delete character.perk1;
        }
        if (character.perk2) {
            character.perks.push({
                name: character.perk2
            });
            delete character.perk2;
        }
        
        // Migrate old flaw1, flaw2 fields to flaws array
        if (character.flaws === undefined) {
            character.flaws = [];
        }
        if (character.flaw1) {
            character.flaws.push({
                name: character.flaw1
            });
            delete character.flaw1;
        }
        if (character.flaw2) {
            character.flaws.push({
                name: character.flaw2
            });
            delete character.flaw2;
        }
        
        // Migrate equipment to ensure universal properties are properly structured
        this.migrateEquipmentStructure(character);
    }

    // Migrate equipment structure to ensure universal properties are properly handled
    migrateEquipmentStructure(character) {
        if (!character.equipment || !Array.isArray(character.equipment)) return;
        
        character.equipment.forEach(item => {
            // Ensure universalProperties array exists
            if (!item.universalProperties) {
                item.universalProperties = [];
            }
            
            // If item has cursed property but no cursedBane/cursedPowerLevel, try to infer from old structure
            if (item.universalProperties.includes('cursed') && (!item.cursedBane || !item.cursedPowerLevel)) {
                // Found cursed item with missing bane data, attempting migration
                
                // Try to find bane data in old properties or other fields
                if (item.cursedBane && item.cursedPowerLevel) {
                    // Cursed item already has bane data
                } else {
                    // Cursed item missing bane data, removing cursed property
                    // Remove cursed property if we can't recover the data
                    item.universalProperties = item.universalProperties.filter(prop => prop !== 'cursed');
                }
            }
        });
    }

    // Migrate advantages and disadvantages to include count field
    migrateAdvantageDisadvantageCounts(character) {
        // Ensure advantages array exists and has count field
        if (!character.advantages) {
            character.advantages = [];
        }
        character.advantages.forEach(advantage => {
            if (advantage.count === undefined) {
                advantage.count = 1;
            }
        });
        
        // Ensure disadvantages array exists and has count field
        if (!character.disadvantages) {
            character.disadvantages = [];
        }
        character.disadvantages.forEach(disadvantage => {
            if (disadvantage.count === undefined) {
                disadvantage.count = 1;
            }
        });
    }

    // Clean character data for export by removing redundant fields
    cleanCharacterForExport(character) {
        // Create a deep copy of the character to avoid modifying the original
        const cleanedCharacter = JSON.parse(JSON.stringify(character));
        
        // Clean up feats - keep only essential data and user inputs
        if (cleanedCharacter.feats) {
            cleanedCharacter.feats = cleanedCharacter.feats.map(feat => {
                const cleanedFeat = {
                    name: feat.name,
                    tier: feat.tier,
                    customDetails: feat.customDetails || null,
                    cost: feat.cost || 0
                };
                
                // Preserve custom properties for specific feats
                if (feat.customInput) {
                    cleanedFeat.customInput = feat.customInput;
                }
                if (feat.customInputLabel) {
                    cleanedFeat.customInputLabel = feat.customInputLabel;
                }
                if (feat.customInputPlaceholder) {
                    cleanedFeat.customInputPlaceholder = feat.customInputPlaceholder;
                }
                
                return cleanedFeat;
            });
        }
        
        // Clean up boons - keep only essential data and user inputs
        if (cleanedCharacter.boons) {
            cleanedCharacter.boons = cleanedCharacter.boons.map(boon => {
                const cleanedBoon = {
                    name: boon.name,
                    powerLevel: boon.powerLevel,
                    duration: boon.duration || 'Sustain',
                    sustaining: boon.sustaining || false
                };
                
                // Preserve custom properties for specific boons
                if (boon.bolsterAttribute) {
                    cleanedBoon.bolsterAttribute = boon.bolsterAttribute;
                }
                if (boon.resistanceType) {
                    cleanedBoon.resistanceType = boon.resistanceType;
                }
                
                return cleanedBoon;
            });
        }
        
        // Clean up banes - keep only essential data and user inputs
        if (cleanedCharacter.banes) {
            cleanedCharacter.banes = cleanedCharacter.banes.map(bane => {
                const cleanedBane = {
                    name: bane.name,
                    powerLevel: bane.powerLevel,
                    duration: bane.duration || 'Sustain',
                    resists: bane.resists || [false, false, false]
                };
                
                // Preserve custom properties for specific banes
                if (bane.fatigueLevel) {
                    cleanedBane.fatigueLevel = bane.fatigueLevel;
                }
                if (bane.source) {
                    cleanedBane.source = bane.source;
                }
                if (bane.removable !== undefined) {
                    cleanedBane.removable = bane.removable;
                }
                
                return cleanedBane;
            });
        }
        
        // Clean up perks - keep only essential data
        if (cleanedCharacter.perks) {
            cleanedCharacter.perks = cleanedCharacter.perks.map(perk => ({
                name: perk.name
            }));
        }
        
        // Clean up flaws - keep only essential data
        if (cleanedCharacter.flaws) {
            cleanedCharacter.flaws = cleanedCharacter.flaws.map(flaw => ({
                name: flaw.name
            }));
        }
        
        return cleanedCharacter;
    }

    // Reconstruct character data from cleaned export data
    reconstructCharacterFromExport(character) {
        // Reconstruct feats with full data from database
        if (character.feats) {
            character.feats = character.feats.map(feat => {
                const databaseFeat = window.GAME_DATABASE.feats.find(dbFeat => 
                    dbFeat.name === feat.name && dbFeat.tier === feat.tier
                );
                
                if (databaseFeat) {
                    return {
                        ...feat, // Keep name, tier, customDetails, and cost
                        description: databaseFeat.description,
                        baseEffectDescription: databaseFeat.baseEffectDescription,
                        effectDescription: databaseFeat.effectDescription,
                        effects: databaseFeat.effects,
                        prerequisites: databaseFeat.prerequisites
                    };
                }
                return feat; // Fallback if not found in database
            });
        }
        
        // Reconstruct boons with full data from database
        if (character.boons) {
            character.boons = character.boons.map(boon => {
                const databaseBoon = window.GAME_DATABASE.boons.find(dbBoon => 
                    dbBoon.name === boon.name
                );
                
                if (databaseBoon) {
                    return {
                        ...boon, // Keep name, powerLevel, duration, and sustaining
                        description: databaseBoon.description,
                        effectDescription: databaseBoon.effectDescription,
                        powerLevelDescriptions: databaseBoon.powerLevelDescriptions,
                        powerLevels: databaseBoon.powerLevels
                    };
                }
                return boon; // Fallback if not found in database
            });
        }
        
        // Reconstruct banes with full data from database
        if (character.banes) {
            character.banes = character.banes.map(bane => {
                const databaseBane = window.GAME_DATABASE.banes.find(dbBane => 
                    dbBane.name === bane.name
                );
                
                if (databaseBane) {
                    return {
                        ...bane, // Keep name, powerLevel, duration, and resists
                        description: databaseBane.description,
                        effectDescription: databaseBane.effectDescription,
                        powerLevelDescriptions: databaseBane.powerLevelDescriptions,
                        powerLevels: databaseBane.powerLevels
                    };
                }
                return bane; // Fallback if not found in database
            });
        }
        
        // Reconstruct perks with full data from database
        if (character.perks) {
            character.perks = character.perks.map(perk => {
                const databasePerk = window.GAME_DATABASE.perks.find(dbPerk => 
                    dbPerk.name === perk.name
                );
                
                if (databasePerk) {
                    return {
                        ...perk, // Keep name
                        description: databasePerk.description,
                        effectDescription: databasePerk.effectDescription
                    };
                }
                return perk; // Fallback if not found in database
            });
        }
        
        // Reconstruct flaws with full data from database
        if (character.flaws) {
            character.flaws = character.flaws.map(flaw => {
                const databaseFlaw = window.GAME_DATABASE.flaws.find(dbFlaw => 
                    dbFlaw.name === flaw.name
                );
                
                if (databaseFlaw) {
                    return {
                        ...flaw, // Keep name
                        description: databaseFlaw.description,
                        effectDescription: databaseFlaw.effectDescription
                    };
                }
                return flaw; // Fallback if not found in database
            });
        }
        
        return character;
    }

    // Save characters to localStorage
    saveCharacters() {
        try {
            localStorage.setItem('openLegendCharacters', JSON.stringify(this.characters));
        } catch (error) {
            console.error('Error saving characters:', error);
            this.showNotification('Error saving characters to local storage.', 'error');
        }
    }

    // === CUSTOM BOONS & BANES METHODS ===

    // Load custom boons from localStorage
    loadCustomBoons() {
        try {
            const saved = localStorage.getItem('openLegendCustomBoons');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading custom boons:', error);
            return [];
        }
    }

    // Save custom boons to localStorage
    saveCustomBoons() {
        try {
            localStorage.setItem('openLegendCustomBoons', JSON.stringify(this.customBoons));
        } catch (error) {
            console.error('Error saving custom boons:', error);
            this.showNotification('Error saving custom boons.', 'error');
        }
    }

    // Load custom banes from localStorage
    loadCustomBanes() {
        try {
            const saved = localStorage.getItem('openLegendCustomBanes');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading custom banes:', error);
            return [];
        }
    }

    // Save custom banes to localStorage
    saveCustomBanes() {
        try {
            localStorage.setItem('openLegendCustomBanes', JSON.stringify(this.customBanes));
        } catch (error) {
            console.error('Error saving custom banes:', error);
            this.showNotification('Error saving custom banes.', 'error');
        }
    }

    // Get current timestamp with Berlin timezone
    getCurrentTimestamp() {
        const date = new Date();
        // Convert to Berlin time (UTC+1 or UTC+2 depending on DST)
        const berlinTime = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
        return berlinTime.toISOString();
    }

    // Create or update custom boon
    saveCustomBoon(boonData) {
        try {
            const timestamp = this.getCurrentTimestamp();
            
            if (boonData.id) {
                // Update existing boon
                const index = this.customBoons.findIndex(b => b.id === boonData.id);
                if (index !== -1) {
                    this.customBoons[index] = {
                        ...boonData,
                        updatedAt: timestamp
                    };
                }
            } else {
                // Create new boon
                const newBoon = {
                    ...boonData,
                    id: Date.now().toString() + '_custom_boon',
                    createdAt: timestamp,
                    updatedAt: timestamp,
                    isCustom: true
                };
                this.customBoons.push(newBoon);
            }
            
            this.saveCustomBoons();
            this.populateCustomBoonsGrid();
            this.populateBoonsDropdown(); // Refresh dropdowns
            this.showNotification('Custom boon saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving custom boon:', error);
            this.showNotification('Error saving custom boon.', 'error');
        }
    }

    // Create or update custom bane
    saveCustomBane(baneData) {
        try {
            const timestamp = this.getCurrentTimestamp();
            
            if (baneData.id) {
                // Update existing bane
                const index = this.customBanes.findIndex(b => b.id === baneData.id);
                if (index !== -1) {
                    this.customBanes[index] = {
                        ...baneData,
                        updatedAt: timestamp
                    };
                }
            } else {
                // Create new bane
                const newBane = {
                    ...baneData,
                    id: Date.now().toString() + '_custom_bane',
                    createdAt: timestamp,
                    updatedAt: timestamp,
                    isCustom: true
                };
                this.customBanes.push(newBane);
            }
            
            this.saveCustomBanes();
            this.populateCustomBanesGrid();
            this.populateBanesDropdown(); // Refresh dropdowns
            this.showNotification('Custom bane saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving custom bane:', error);
            this.showNotification('Error saving custom bane.', 'error');
        }
    }

    // Delete custom boon
    deleteCustomBoon(boonId) {
        if (confirm('Are you sure you want to delete this custom boon?')) {
            this.customBoons = this.customBoons.filter(b => b.id !== boonId);
            this.saveCustomBoons();
            this.populateCustomBoonsGrid();
            this.populateBoonsDropdown(); // Refresh dropdowns
            this.showNotification('Custom boon deleted.', 'success');
        }
    }

    // Delete custom bane
    deleteCustomBane(baneId) {
        if (confirm('Are you sure you want to delete this custom bane?')) {
            this.customBanes = this.customBanes.filter(b => b.id !== baneId);
            this.saveCustomBanes();
            this.populateCustomBanesGrid();
            this.populateBanesDropdown(); // Refresh dropdowns
            this.showNotification('Custom bane deleted.', 'success');
        }
    }

    // Populate custom boons grid in Options List page
    populateCustomBoonsGrid() {
        const grid = document.getElementById('customBoonsGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (this.customBoons.length === 0) {
            grid.innerHTML = '<p class="text-secondary">No custom boons yet. Click "Add Custom Boon" to create one.</p>';
            return;
        }
        
        this.customBoons.forEach(boon => {
            const card = document.createElement('div');
            card.className = 'custom-entry-card';
            card.innerHTML = `
                <div class="custom-entry-main">
                    <div class="custom-entry-title">${boon.name}</div>
                    <div class="custom-entry-meta">
                        <span><strong>Power Levels:</strong> ${boon.powerLevels.join(', ')}</span>
                        <span><strong>Attributes:</strong> ${boon.attributes.join(', ')}</span>
                    </div>
                    <div class="custom-entry-description">
                        ${boon.generalDescription.substring(0, 200)}${boon.generalDescription.length > 200 ? '...' : ''}
                    </div>
                </div>
                <div class="custom-entry-actions">
                    <button class="btn btn-small btn-secondary" onclick="window.app.editCustomBoon('${boon.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-small btn-danger" onclick="window.app.deleteCustomBoon('${boon.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // Populate custom banes grid in Options List page
    populateCustomBanesGrid() {
        const grid = document.getElementById('customBanesGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (this.customBanes.length === 0) {
            grid.innerHTML = '<p class="text-secondary">No custom banes yet. Click "Add Custom Bane" to create one.</p>';
            return;
        }
        
        this.customBanes.forEach(bane => {
            const card = document.createElement('div');
            card.className = 'custom-entry-card';
            card.innerHTML = `
                <div class="custom-entry-main">
                    <div class="custom-entry-title">${bane.name}</div>
                    <div class="custom-entry-meta">
                        <span><strong>Power Levels:</strong> ${bane.powerLevels.join(', ')}</span>
                        <span><strong>Attributes:</strong> ${bane.attributes.join(', ')}</span>
                    </div>
                    <div class="custom-entry-description">
                        ${bane.generalDescription.substring(0, 200)}${bane.generalDescription.length > 200 ? '...' : ''}
                    </div>
                </div>
                <div class="custom-entry-actions">
                    <button class="btn btn-small btn-secondary" onclick="window.app.editCustomBane('${bane.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-small btn-danger" onclick="window.app.deleteCustomBane('${bane.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // Export custom boons and banes as file
    exportCustomEntries() {
        const data = {
            customBoons: this.customBoons,
            customBanes: this.customBanes,
            exportedAt: this.getCurrentTimestamp()
        };
        
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `custom-boons-banes-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Custom entries exported as file!', 'success');
    }

    // Export custom boons and banes as text for copying
    exportCustomEntriesAsText() {
        const data = {
            customBoons: this.customBoons,
            customBanes: this.customBanes,
            exportedAt: this.getCurrentTimestamp()
        };
        
        const json = JSON.stringify(data, null, 2);
        const textarea = document.getElementById('exportCustomTextArea');
        textarea.value = json;
        
        document.getElementById('exportCustomTextModal').style.display = 'block';
    }

    // Copy export text to clipboard
    copyExportTextToClipboard() {
        const textarea = document.getElementById('exportCustomTextArea');
        textarea.select();
        textarea.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            document.execCommand('copy');
            this.showNotification('Copied to clipboard! You can now paste it anywhere.', 'success');
        } catch (err) {
            // Fallback to navigator.clipboard API
            navigator.clipboard.writeText(textarea.value).then(() => {
                this.showNotification('Copied to clipboard!', 'success');
            }).catch(err => {
                this.showNotification('Failed to copy. Please select and copy manually.', 'error');
            });
        }
    }

    // Import custom entries with duplicate handling (keep newest)
    importCustomEntries(data) {
        try {
            let importedData;
            if (typeof data === 'string') {
                importedData = JSON.parse(data);
            } else {
                importedData = data;
            }
            
            let boonsAdded = 0;
            let boonsUpdated = 0;
            let banesAdded = 0;
            let banesUpdated = 0;
            
            // Import custom boons with duplicate handling
            if (importedData.customBoons && Array.isArray(importedData.customBoons)) {
                importedData.customBoons.forEach(importedBoon => {
                    const existingIndex = this.customBoons.findIndex(b => b.name === importedBoon.name);
                    
                    if (existingIndex !== -1) {
                        // Compare timestamps (keep newest)
                        const existingTime = new Date(this.customBoons[existingIndex].updatedAt || this.customBoons[existingIndex].createdAt);
                        const importedTime = new Date(importedBoon.updatedAt || importedBoon.createdAt);
                        
                        if (importedTime > existingTime) {
                            this.customBoons[existingIndex] = {
                                ...importedBoon,
                                id: this.customBoons[existingIndex].id // Keep original ID
                            };
                            boonsUpdated++;
                        }
                    } else {
                        // Add new custom boon
                        this.customBoons.push({
                            ...importedBoon,
                            id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9) + '_custom_boon',
                            isCustom: true
                        });
                        boonsAdded++;
                    }
                });
            }
            
            // Import custom banes with duplicate handling
            if (importedData.customBanes && Array.isArray(importedData.customBanes)) {
                importedData.customBanes.forEach(importedBane => {
                    const existingIndex = this.customBanes.findIndex(b => b.name === importedBane.name);
                    
                    if (existingIndex !== -1) {
                        // Compare timestamps (keep newest)
                        const existingTime = new Date(this.customBanes[existingIndex].updatedAt || this.customBanes[existingIndex].createdAt);
                        const importedTime = new Date(importedBane.updatedAt || importedBane.createdAt);
                        
                        if (importedTime > existingTime) {
                            this.customBanes[existingIndex] = {
                                ...importedBane,
                                id: this.customBanes[existingIndex].id // Keep original ID
                            };
                            banesUpdated++;
                        }
                    } else {
                        // Add new custom bane
                        this.customBanes.push({
                            ...importedBane,
                            id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9) + '_custom_bane',
                            isCustom: true
                        });
                        banesAdded++;
                    }
                });
            }
            
            this.saveCustomBoons();
            this.saveCustomBanes();
            this.populateCustomBoonsGrid();
            this.populateCustomBanesGrid();
            this.populateBoonsDropdown(); // Refresh dropdowns
            this.populateBanesDropdown(); // Refresh dropdowns
            
            let message = 'Import complete! ';
            if (boonsAdded > 0) message += `${boonsAdded} boon(s) added. `;
            if (boonsUpdated > 0) message += `${boonsUpdated} boon(s) updated. `;
            if (banesAdded > 0) message += `${banesAdded} bane(s) added. `;
            if (banesUpdated > 0) message += `${banesUpdated} bane(s) updated.`;
            
            this.showNotification(message, 'success');
            this.closeModal(document.getElementById('importCustomModal'));
        } catch (error) {
            console.error('Error importing custom entries:', error);
            this.showNotification('Error importing custom entries. Please check the file format.', 'error');
        }
    }

    // Show custom boon modal for creating new boon
    showCustomBoonModal() {
        const modal = document.getElementById('customBoonModal');
        document.getElementById('customBoonModalTitle').textContent = 'Create Custom Boon';
        document.getElementById('customBoonId').value = '';
        document.getElementById('customBoonName').value = '';
        document.getElementById('customBoonPowerLevels').value = '';
        document.querySelectorAll('input[name="customBoonAttr"]').forEach(cb => cb.checked = false);
        document.getElementById('customBoonInvocationTime').value = '';
        document.getElementById('customBoonDuration').value = '';
        document.getElementById('customBoonGeneralDesc').value = '';
        document.getElementById('customBoonEffectDesc').value = '';
        document.getElementById('customBoonSpecialText').value = '';
        document.getElementById('customBoonPowerLevelDescs').innerHTML = '';
        modal.style.display = 'block';
    }

    // Edit existing custom boon
    editCustomBoon(boonId) {
        const boon = this.customBoons.find(b => b.id === boonId);
        if (!boon) return;
        
        const modal = document.getElementById('customBoonModal');
        document.getElementById('customBoonModalTitle').textContent = 'Edit Custom Boon';
        document.getElementById('customBoonId').value = boon.id;
        document.getElementById('customBoonName').value = boon.name;
        document.getElementById('customBoonPowerLevels').value = boon.powerLevels.join(',');
        
        // Set attributes
        document.querySelectorAll('input[name="customBoonAttr"]').forEach(cb => {
            cb.checked = boon.attributes.includes(cb.value);
        });
        
        document.getElementById('customBoonInvocationTime').value = boon.invocationTime || '';
        document.getElementById('customBoonDuration').value = boon.duration || '';
        document.getElementById('customBoonGeneralDesc').value = boon.generalDescription || '';
        document.getElementById('customBoonEffectDesc').value = boon.effectDescription || '';
        document.getElementById('customBoonSpecialText').value = boon.specialText || '';
        
        // Generate power level description fields
        this.generatePowerLevelFields('boon', boon.powerLevels, boon.powerLevelDescriptions);
        
        modal.style.display = 'block';
    }

    // Show custom bane modal for creating new bane
    showCustomBaneModal() {
        const modal = document.getElementById('customBaneModal');
        document.getElementById('customBaneModalTitle').textContent = 'Create Custom Bane';
        document.getElementById('customBaneId').value = '';
        document.getElementById('customBaneName').value = '';
        document.getElementById('customBanePowerLevels').value = '';
        document.querySelectorAll('input[name="customBaneAttr"]').forEach(cb => cb.checked = false);
        document.getElementById('customBaneDuration').value = '';
        document.getElementById('customBaneGeneralDesc').value = '';
        document.getElementById('customBaneEffectDesc').value = '';
        document.getElementById('customBaneSpecialText').value = '';
        document.getElementById('customBanePowerLevelDescs').innerHTML = '';
        document.getElementById('customBaneDefenseTargets').innerHTML = '';
        modal.style.display = 'block';
    }

    // Edit existing custom bane
    editCustomBane(baneId) {
        const bane = this.customBanes.find(b => b.id === baneId);
        if (!bane) return;
        
        const modal = document.getElementById('customBaneModal');
        document.getElementById('customBaneModalTitle').textContent = 'Edit Custom Bane';
        document.getElementById('customBaneId').value = bane.id;
        document.getElementById('customBaneName').value = bane.name;
        document.getElementById('customBanePowerLevels').value = bane.powerLevels.join(',');
        
        // Set attributes
        document.querySelectorAll('input[name="customBaneAttr"]').forEach(cb => {
            cb.checked = bane.attributes.includes(cb.value);
        });
        
        document.getElementById('customBaneDuration').value = bane.duration || '';
        document.getElementById('customBaneGeneralDesc').value = bane.generalDescription || '';
        document.getElementById('customBaneEffectDesc').value = bane.effectDescription || '';
        document.getElementById('customBaneSpecialText').value = bane.specialText || '';
        
        // Generate defense targets and power level fields
        this.generateDefenseTargetFields(bane.attributes, bane.defenseTargets);
        this.generatePowerLevelFields('bane', bane.powerLevels, bane.powerLevelDescriptions);
        
        modal.style.display = 'block';
    }

    // Generate power level description fields dynamically
    generatePowerLevelFields(type, powerLevels, existingDescriptions = {}) {
        const container = document.getElementById(type === 'boon' ? 'customBoonPowerLevelDescs' : 'customBanePowerLevelDescs');
        container.innerHTML = '';
        
        powerLevels.forEach(level => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'power-level-input';
            fieldDiv.innerHTML = `
                <label>Power Level ${level} Description</label>
                <textarea data-power-level="${level}" rows="2" placeholder="Enter description for power level ${level}">${existingDescriptions[level]?.description || ''}</textarea>
            `;
            container.appendChild(fieldDiv);
        });
    }

    // Generate defense target fields for bane
    generateDefenseTargetFields(attributes, existingTargets = {}) {
        const container = document.getElementById('customBaneDefenseTargets');
        container.innerHTML = '';
        
        attributes.forEach(attr => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'defense-target-input';
            fieldDiv.innerHTML = `
                <label>${attr.charAt(0).toUpperCase() + attr.slice(1)}</label>
                <select data-attribute="${attr}">
                    <option value="">Select defense...</option>
                    <option value="guard" ${existingTargets[attr] === 'guard' ? 'selected' : ''}>Guard</option>
                    <option value="toughness" ${existingTargets[attr] === 'toughness' ? 'selected' : ''}>Toughness</option>
                    <option value="resolve" ${existingTargets[attr] === 'resolve' ? 'selected' : ''}>Resolve</option>
                </select>
            `;
            container.appendChild(fieldDiv);
        });
    }

    // Handle custom boon form submission
    handleCustomBoonSubmit() {
        try {
            const id = document.getElementById('customBoonId').value;
            const name = document.getElementById('customBoonName').value.trim();
            const powerLevelsStr = document.getElementById('customBoonPowerLevels').value.trim();
            const invocationTime = document.getElementById('customBoonInvocationTime').value.trim();
            const duration = document.getElementById('customBoonDuration').value.trim();
            const generalDescription = document.getElementById('customBoonGeneralDesc').value.trim();
            const effectDescription = document.getElementById('customBoonEffectDesc').value.trim();
            const specialText = document.getElementById('customBoonSpecialText').value.trim();
            
            // Validate required fields
            if (!name) {
                this.showNotification('Please enter a boon name.', 'error');
                return;
            }
            
            if (!powerLevelsStr) {
                this.showNotification('Please enter power levels.', 'error');
                return;
            }
            
            // Parse power levels
            const powerLevels = powerLevelsStr.split(',').map(pl => parseInt(pl.trim())).filter(pl => !isNaN(pl));
            if (powerLevels.length === 0) {
                this.showNotification('Please enter valid power levels.', 'error');
                return;
            }
            
            // Get selected attributes
            const attributes = [];
            document.querySelectorAll('input[name="customBoonAttr"]:checked').forEach(cb => {
                attributes.push(cb.value);
            });
            
            if (attributes.length === 0) {
                this.showNotification('Please select at least one attribute.', 'error');
                return;
            }
            
            if (!invocationTime || !duration || !generalDescription || !effectDescription) {
                this.showNotification('Please fill in all required fields.', 'error');
                return;
            }
            
            // Get power level descriptions
            const powerLevelDescriptions = {};
            document.querySelectorAll('#customBoonPowerLevelDescs textarea').forEach(textarea => {
                const level = parseInt(textarea.dataset.powerLevel);
                const description = textarea.value.trim();
                if (description) {
                    powerLevelDescriptions[level] = { description };
                }
            });
            
            const boonData = {
                id: id || undefined,
                name,
                powerLevels,
                attributes,
                invocationTime,
                duration,
                generalDescription,
                effectDescription,
                powerLevelDescriptions,
                specialText
            };
            
            this.saveCustomBoon(boonData);
            this.closeModal(document.getElementById('customBoonModal'));
        } catch (error) {
            console.error('Error submitting custom boon:', error);
            this.showNotification('Error saving custom boon.', 'error');
        }
    }

    // Handle custom bane form submission
    handleCustomBaneSubmit() {
        try {
            const id = document.getElementById('customBaneId').value;
            const name = document.getElementById('customBaneName').value.trim();
            const powerLevelsStr = document.getElementById('customBanePowerLevels').value.trim();
            const duration = document.getElementById('customBaneDuration').value.trim();
            const generalDescription = document.getElementById('customBaneGeneralDesc').value.trim();
            const effectDescription = document.getElementById('customBaneEffectDesc').value.trim();
            const specialText = document.getElementById('customBaneSpecialText').value.trim();
            
            // Validate required fields
            if (!name) {
                this.showNotification('Please enter a bane name.', 'error');
                return;
            }
            
            if (!powerLevelsStr) {
                this.showNotification('Please enter power levels.', 'error');
                return;
            }
            
            // Parse power levels
            const powerLevels = powerLevelsStr.split(',').map(pl => parseInt(pl.trim())).filter(pl => !isNaN(pl));
            if (powerLevels.length === 0) {
                this.showNotification('Please enter valid power levels.', 'error');
                return;
            }
            
            // Get selected attributes
            const attributes = [];
            document.querySelectorAll('input[name="customBaneAttr"]:checked').forEach(cb => {
                attributes.push(cb.value);
            });
            
            if (attributes.length === 0) {
                this.showNotification('Please select at least one attribute.', 'error');
                return;
            }
            
            if (!duration || !generalDescription || !effectDescription) {
                this.showNotification('Please fill in all required fields.', 'error');
                return;
            }
            
            // Get defense targets
            const defenseTargets = {};
            document.querySelectorAll('#customBaneDefenseTargets select').forEach(select => {
                const attr = select.dataset.attribute;
                const defense = select.value;
                if (defense) {
                    defenseTargets[attr] = defense;
                }
            });
            
            // Get power level descriptions
            const powerLevelDescriptions = {};
            document.querySelectorAll('#customBanePowerLevelDescs textarea').forEach(textarea => {
                const level = parseInt(textarea.dataset.powerLevel);
                const description = textarea.value.trim();
                if (description) {
                    powerLevelDescriptions[level] = { description };
                }
            });
            
            const baneData = {
                id: id || undefined,
                name,
                powerLevels,
                attributes,
                defenseTargets,
                duration,
                generalDescription,
                effectDescription,
                powerLevelDescriptions,
                specialText
            };
            
            this.saveCustomBane(baneData);
            this.closeModal(document.getElementById('customBaneModal'));
        } catch (error) {
            console.error('Error submitting custom bane:', error);
            this.showNotification('Error saving custom bane.', 'error');
        }
    }

    // Show import custom entries modal
    showImportCustomModal() {
        document.getElementById('importCustomModal').style.display = 'block';
        this.selectedCustomFile = null;
        document.getElementById('customFileInfo').style.display = 'none';
        document.getElementById('customUploadPlaceholder').style.display = 'block';
        document.getElementById('uploadCustomFileBtn').style.display = 'none';
        document.getElementById('importCustomData').value = '';
    }

    // Handle custom file selection
    handleCustomFileSelection(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.name.endsWith('.json')) {
            this.showNotification('Please select a JSON file.', 'error');
            return;
        }
        
        this.selectedCustomFile = file;
        document.getElementById('customFileName').textContent = file.name;
        document.getElementById('customUploadPlaceholder').style.display = 'none';
        document.getElementById('customFileInfo').style.display = 'flex';
        document.getElementById('uploadCustomFileBtn').style.display = 'inline-flex';
    }

    // Remove selected custom file
    removeCustomFile() {
        this.selectedCustomFile = null;
        document.getElementById('customJsonFileInput').value = '';
        document.getElementById('customFileInfo').style.display = 'none';
        document.getElementById('customUploadPlaceholder').style.display = 'block';
        document.getElementById('uploadCustomFileBtn').style.display = 'none';
    }

    // Upload custom file
    uploadCustomFile() {
        if (!this.selectedCustomFile) {
            this.showNotification('Please select a file first.', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.importCustomEntries(data);
            } catch (error) {
                console.error('Error reading file:', error);
                this.showNotification('Invalid JSON file format.', 'error');
            }
        };
        reader.readAsText(this.selectedCustomFile);
    }

    // Confirm import from text
    confirmImportCustom() {
        const data = document.getElementById('importCustomData').value.trim();
        if (!data) {
            this.showNotification('Please paste JSON data or select a file.', 'error');
            return;
        }
        
        try {
            const parsedData = JSON.parse(data);
            this.importCustomEntries(parsedData);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            this.showNotification('Invalid JSON format.', 'error');
        }
    }

    // === END CUSTOM BOONS & BANES METHODS ===

    // === MANUAL SETTINGS & CUSTOM HEALTH BUFF ===

    // Update custom health buff
    updateCustomHealthBuff() {
        if (!this.currentCharacter) return;
        
        const customHealthBuff = parseInt(document.getElementById('customHealthBuff').value) || 0;
        this.currentCharacter.customHealthBuff = customHealthBuff;
        
        this.updateMaxHP();
        this.autoSave();
        this.showNotification(`Custom health buff set to ${customHealthBuff}`, 'success');
    }

    // Toggle manual settings mode
    toggleManualSettings() {
        if (!this.currentCharacter) return;
        
        const isManual = document.getElementById('manualSettingsToggle').checked;
        this.currentCharacter.manualSettings = isManual;
        
        if (isManual) {
            // Enable manual mode - set initial values from calculated
            this.enableManualMode();
            this.showNotification('Manual Settings enabled - Limits and calculations overridden', 'info');
        } else {
            // Disable manual mode - return to automatic calculations
            this.disableManualMode();
            this.showNotification('Manual Settings disabled - Automatic calculations restored', 'info');
        }
        
        this.autoSave();
    }

    // Enable manual mode
    enableManualMode() {
        if (!this.currentCharacter) return;
        
        // Initialize manual overrides if they don't exist
        if (!this.currentCharacter.manualOverrides) {
            this.currentCharacter.manualOverrides = {};
        }
        
        // Set initial defense values from current displayed values
        const guardValueEl = document.getElementById('guardValue');
        const toughnessValueEl = document.getElementById('toughnessValue');
        const resolveValueEl = document.getElementById('resolveValue');
        
        const currentGuard = guardValueEl ? parseInt(guardValueEl.textContent) || 10 : 10;
        const currentToughness = toughnessValueEl ? parseInt(toughnessValueEl.textContent) || 10 : 10;
        const currentResolve = resolveValueEl ? parseInt(resolveValueEl.textContent) || 10 : 10;
        
        if (!this.currentCharacter.manualOverrides.guard) {
            this.currentCharacter.manualOverrides.guard = currentGuard;
        }
        if (!this.currentCharacter.manualOverrides.toughness) {
            this.currentCharacter.manualOverrides.toughness = currentToughness;
        }
        if (!this.currentCharacter.manualOverrides.resolve) {
            this.currentCharacter.manualOverrides.resolve = currentResolve;
        }
        
        // Set initial movement values from current calculated values
        const currentMovement = parseInt(document.getElementById('movementSpeed').textContent) || 30;
        const currentClimbing = parseInt(document.getElementById('climbingSpeed').textContent) || 15;
        const currentSwimming = parseInt(document.getElementById('swimmingSpeed').textContent) || 15;
        const currentFlying = parseInt(document.getElementById('flyingSpeed').textContent) || 0;
        
        if (!this.currentCharacter.manualOverrides.movementSpeed) {
            this.currentCharacter.manualOverrides.movementSpeed = currentMovement;
        }
        if (!this.currentCharacter.manualOverrides.climbingSpeed) {
            this.currentCharacter.manualOverrides.climbingSpeed = currentClimbing;
        }
        if (!this.currentCharacter.manualOverrides.swimmingSpeed) {
            this.currentCharacter.manualOverrides.swimmingSpeed = currentSwimming;
        }
        if (!this.currentCharacter.manualOverrides.flyingSpeed) {
            this.currentCharacter.manualOverrides.flyingSpeed = currentFlying;
        }
        
        // Show manual inputs and hide calculated values
        this.showManualInputs();
    }

    // Disable manual mode
    disableManualMode() {
        if (!this.currentCharacter) return;
        
        // Hide manual inputs and show calculated values
        this.hideManualInputs();
        
        // Recalculate everything
        this.updateDefenseStats();
        this.updateMovementStats();
    }

    // Show manual inputs
    showManualInputs() {
        // Defense values
        const guardInput = document.getElementById('guardValueManual');
        const toughnessInput = document.getElementById('toughnessValueManual');
        const resolveInput = document.getElementById('resolveValueManual');
        
        if (guardInput) {
            guardInput.value = this.currentCharacter.manualOverrides.guard || 10;
            guardInput.style.display = 'block';
            document.getElementById('guardValue').style.display = 'none';
        }
        if (toughnessInput) {
            toughnessInput.value = this.currentCharacter.manualOverrides.toughness || 10;
            toughnessInput.style.display = 'block';
            document.getElementById('toughnessValue').style.display = 'none';
        }
        if (resolveInput) {
            resolveInput.value = this.currentCharacter.manualOverrides.resolve || 10;
            resolveInput.style.display = 'block';
            document.getElementById('resolveValue').style.display = 'none';
        }
        
        // Movement speeds
        const movementInput = document.getElementById('movementSpeedManual');
        const climbingInput = document.getElementById('climbingSpeedManual');
        const swimmingInput = document.getElementById('swimmingSpeedManual');
        const flyingInput = document.getElementById('flyingSpeedManual');
        
        if (movementInput) {
            movementInput.value = this.currentCharacter.manualOverrides.movementSpeed || 30;
            movementInput.style.display = 'inline-block';
            document.getElementById('movementSpeed').style.display = 'none';
        }
        if (climbingInput) {
            climbingInput.value = this.currentCharacter.manualOverrides.climbingSpeed || 15;
            climbingInput.style.display = 'inline-block';
            document.getElementById('climbingSpeed').style.display = 'none';
        }
        if (swimmingInput) {
            swimmingInput.value = this.currentCharacter.manualOverrides.swimmingSpeed || 15;
            swimmingInput.style.display = 'inline-block';
            document.getElementById('swimmingSpeed').style.display = 'none';
        }
        if (flyingInput) {
            flyingInput.value = this.currentCharacter.manualOverrides.flyingSpeed || 0;
            flyingInput.style.display = 'inline-block';
            document.getElementById('flyingSpeed').style.display = 'none';
        }
    }

    // Hide manual inputs
    hideManualInputs() {
        // Defense values
        document.getElementById('guardValueManual').style.display = 'none';
        document.getElementById('toughnessValueManual').style.display = 'none';
        document.getElementById('resolveValueManual').style.display = 'none';
        document.getElementById('guardValue').style.display = 'block';
        document.getElementById('toughnessValue').style.display = 'block';
        document.getElementById('resolveValue').style.display = 'block';
        
        // Movement speeds
        document.getElementById('movementSpeedManual').style.display = 'none';
        document.getElementById('climbingSpeedManual').style.display = 'none';
        document.getElementById('swimmingSpeedManual').style.display = 'none';
        document.getElementById('flyingSpeedManual').style.display = 'none';
        document.getElementById('movementSpeed').style.display = 'inline';
        document.getElementById('climbingSpeed').style.display = 'inline';
        document.getElementById('swimmingSpeed').style.display = 'inline';
        document.getElementById('flyingSpeed').style.display = 'inline';
    }

    // Save manual defense value
    saveManualDefense(defenseType) {
        if (!this.currentCharacter) return;
        
        const value = parseInt(document.getElementById(`${defenseType}ValueManual`).value) || 10;
        
        if (!this.currentCharacter.manualOverrides) {
            this.currentCharacter.manualOverrides = {};
        }
        
        this.currentCharacter.manualOverrides[defenseType] = value;
        this.autoSave();
    }

    // Save manual movement speed
    saveManualMovement(movementType) {
        if (!this.currentCharacter) return;
        
        const inputId = movementType === 'movement' ? 'movementSpeedManual' : `${movementType}SpeedManual`;
        const value = parseInt(document.getElementById(inputId).value) || 0;
        
        if (!this.currentCharacter.manualOverrides) {
            this.currentCharacter.manualOverrides = {};
        }
        
        this.currentCharacter.manualOverrides[`${movementType}Speed`] = value;
        this.autoSave();
    }

    // === END MANUAL SETTINGS & CUSTOM HEALTH BUFF ===

    // === FAVORITE ACTIONS ===

    // Add favorite action
    addFavoriteAction() {
        if (!this.currentCharacter) return;
        
        const nameInput = document.getElementById('favoriteActionName');
        const attributeSelect = document.getElementById('favoriteActionAttribute');
        const timeInput = document.getElementById('favoriteActionTime');
        
        const name = nameInput.value.trim();
        const attribute = attributeSelect.value;
        const invocationTime = timeInput.value.trim();
        
        if (!name) {
            this.showNotification('Please enter an action name.', 'error');
            return;
        }
        
        if (!attribute) {
            this.showNotification('Please select an attribute.', 'error');
            return;
        }
        
        if (!invocationTime) {
            this.showNotification('Please enter an invocation time.', 'error');
            return;
        }
        
        // Initialize favoriteActions array if it doesn't exist
        if (!this.currentCharacter.favoriteActions) {
            this.currentCharacter.favoriteActions = [];
        }
        
        const favoriteAction = {
            id: Date.now().toString() + '_fav',
            name,
            attribute,
            invocationTime
        };
        
        this.currentCharacter.favoriteActions.push(favoriteAction);
        
        // Clear inputs
        nameInput.value = '';
        attributeSelect.value = '';
        timeInput.value = '';
        
        // Refresh display
        this.populateFavoriteActions();
        this.autoSave();
        this.showNotification('Favorite action added!', 'success');
    }

    // Remove favorite action
    removeFavoriteAction(actionId) {
        if (!this.currentCharacter) return;
        
        this.currentCharacter.favoriteActions = this.currentCharacter.favoriteActions.filter(a => a.id !== actionId);
        this.populateFavoriteActions();
        this.autoSave();
        this.showNotification('Favorite action removed.', 'info');
    }

    // Populate favorite actions list
    populateFavoriteActions() {
        if (!this.currentCharacter) return;
        
        const listEl = document.getElementById('favoriteActionsList');
        if (!listEl) return;
        
        listEl.innerHTML = '';
        
        if (!this.currentCharacter.favoriteActions || this.currentCharacter.favoriteActions.length === 0) {
            listEl.innerHTML = '<p class="text-secondary" style="text-align: center; padding: var(--spacing-lg);">No favorite actions yet. Add one below!</p>';
            return;
        }
        
        this.currentCharacter.favoriteActions.forEach(action => {
            const item = document.createElement('div');
            item.className = 'favorite-action-item';
            
            // Get attribute score and dice
            const attributeScore = this.getEffectiveAttributeScore(action.attribute);
            const attributeDice = this.calculateAttributeDice(attributeScore, action.attribute);
            
            // Calculate advantage/disadvantage for this attribute
            const advantageResult = this.calculateAttributeAdvantageDisadvantage(action.attribute);
            
            // Format advantage/disadvantage display
            let advantageText = '';
            let advantageClass = 'neutral';
            if (advantageResult > 0) {
                advantageText = `Advantage ${advantageResult}`;
                advantageClass = 'positive';
            } else if (advantageResult < 0) {
                advantageText = `Disadvantage ${Math.abs(advantageResult)}`;
                advantageClass = 'negative';
            } else {
                advantageText = 'No Adv/Dis';
                advantageClass = 'neutral';
            }
            
            item.innerHTML = `
                <div class="favorite-action-main">
                    <div class="favorite-action-header">
                        <span class="favorite-action-name">${action.name}</span>
                        <span class="favorite-action-badge">${action.attribute.charAt(0).toUpperCase() + action.attribute.slice(1)}</span>
                        <span class="favorite-action-badge">${action.invocationTime}</span>
                    </div>
                    <div class="favorite-action-stats">
                        <div class="favorite-action-stat">
                            <strong>Score:</strong> <span>${attributeScore}</span>
                        </div>
                        <div class="favorite-action-stat">
                            <strong>Dice:</strong> <span class="favorite-action-dice">${attributeDice}</span>
                        </div>
                        <div class="favorite-action-stat">
                            <span class="favorite-action-advantage ${advantageClass}">${advantageText}</span>
                        </div>
                    </div>
                </div>
                <div class="favorite-action-remove">
                    <button class="btn btn-small btn-danger favorite-action-delete-btn" onclick="window.app.removeFavoriteAction('${action.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            listEl.appendChild(item);
        });
    }

    // Calculate advantage/disadvantage for a specific attribute
    calculateAttributeAdvantageDisadvantage(attributeName) {
        if (!this.currentCharacter) return 0;
        
        let totalAdvantage = 0;
        let totalDisadvantage = 0;
        
        // Check advantages - read from DOM checkboxes
        if (this.currentCharacter.advantages) {
            this.currentCharacter.advantages.forEach(adv => {
                // Check if checkbox is checked in DOM
                const checkbox = document.getElementById(`adv_${adv.name}`);
                const isChecked = checkbox ? checkbox.checked : true; // Default to true if checkbox not found
                
                if (isChecked && (adv.attribute === attributeName || adv.attribute === 'all attributes')) {
                    totalAdvantage += adv.count || 1;
                }
            });
        }
        
        // Check disadvantages - read from DOM checkboxes
        if (this.currentCharacter.disadvantages) {
            this.currentCharacter.disadvantages.forEach(dis => {
                // Check if checkbox is checked in DOM
                const checkbox = document.getElementById(`dis_${dis.name}`);
                const isChecked = checkbox ? checkbox.checked : true; // Default to true if checkbox not found
                
                if (isChecked && (dis.attribute === attributeName || dis.attribute === 'all attributes')) {
                    totalDisadvantage += dis.count || 1;
                }
            });
        }
        
        return totalAdvantage - totalDisadvantage;
    }

    // === END FAVORITE ACTIONS ===

    // Update character name display
    updateCharacterNameDisplay() {
        if (!this.currentCharacter) return;
        
        const newName = document.getElementById('charName').value;
        this.currentCharacter.name = newName;
        document.getElementById('sheetCharName').textContent = newName;
        this.autoSave();
    }

    // Update character archetype display
    updateCharacterArchetypeDisplay() {
        if (!this.currentCharacter) return;
        
        const newArchetype = document.getElementById('charArchetype').value;
        this.currentCharacter.archetype = newArchetype;
        document.getElementById('sheetCharArchetype').textContent = newArchetype || 'Archetype';
        this.autoSave();
    }

    // Toggle equipment fields visibility
    toggleEquipmentFields() {
        const equipmentType = document.getElementById('equipmentType').value;
        const armorFields = document.getElementById('armorFields');
        const weaponFields = document.getElementById('weaponFields');
        const itemFields = document.getElementById('itemFields');
        
        // Hide all fields first
        if (armorFields) armorFields.style.display = 'none';
        if (weaponFields) weaponFields.style.display = 'none';
        if (itemFields) itemFields.style.display = 'none';
        
        // Show appropriate fields based on type
        if (equipmentType === 'armor') {
            if (armorFields) armorFields.style.display = 'block';
        } else if (equipmentType === 'weapon') {
            if (weaponFields) weaponFields.style.display = 'block';
        } else if (equipmentType === 'item') {
            if (itemFields) itemFields.style.display = 'block';
        }
    }



    // Setup universal property event listeners for all equipment types
    setupUniversalPropertyListeners() {
        console.log('🔧 Setting up universal property listeners...');
        const equipmentTypes = ['item', 'weapon', 'armor'];
        
        equipmentTypes.forEach(type => {
            // Area property
            const areaCheckbox = document.getElementById(`${type}Area`);
            if (areaCheckbox) {
                areaCheckbox.addEventListener('change', () => this.toggleUniversalPropertyInputs(type, 'area'));
            }
            
            // Powerful property
            const powerfulCheckbox = document.getElementById(`${type}Powerful`);
            if (powerfulCheckbox) {
                powerfulCheckbox.addEventListener('change', () => this.toggleUniversalPropertyInputs(type, 'powerful'));
            }
            
            // Cursed property
            const cursedCheckbox = document.getElementById(`${type}Cursed`);
            if (cursedCheckbox) {
                cursedCheckbox.addEventListener('change', () => {
                    
                    this.toggleUniversalPropertyInputs(type, 'cursed');
                });
            }
            
            // Cursed bane selection change
            const cursedBaneSelect = document.getElementById(`${type}CursedBane`);
            if (cursedBaneSelect) {
                cursedBaneSelect.addEventListener('change', () => this.updateCursedBanePowerLevels(type));
            }
            
            // Persistent property
            const persistentCheckbox = document.getElementById(`${type}Persistent`);
            if (persistentCheckbox) {
                persistentCheckbox.addEventListener('change', () => {
                    
                    this.toggleUniversalPropertyInputs(type, 'persistent');
                });
            }
            
            // Persistent boon selection change
            const persistentBoonSelect = document.getElementById(`${type}PersistentBoon`);
            if (persistentBoonSelect) {
                persistentBoonSelect.addEventListener('change', () => this.updatePersistentBoonPowerLevels(type));
            }
            
            // Reliable property
            const reliableCheckbox = document.getElementById(`${type}Reliable`);
            if (reliableCheckbox) {
                // Found reliable checkbox
                reliableCheckbox.addEventListener('change', () => {
                    // Reliable property toggled
                    this.toggleUniversalPropertyInputs(type, 'reliable');
                });
            } else {
                console.warn(`No reliable checkbox found for ${type}`);
            }
            
            // Reliable boon selection change
            const reliableBoonSelect = document.getElementById(`${type}ReliableBoon`);
            if (reliableBoonSelect) {
                reliableBoonSelect.addEventListener('change', () => this.updateReliableBoonPowerLevels(type));
            }
        });
        
        // Test functions removed for production
    }

    // Toggle universal property inputs
    toggleUniversalPropertyInputs(equipmentType, property) {
        const checkbox = document.getElementById(`${equipmentType}${property.charAt(0).toUpperCase() + property.slice(1)}`);
        
        if (property === 'area') {
            const areaSizeInput = document.getElementById(`${equipmentType}AreaSizeInput`);
            if (areaSizeInput) {
                areaSizeInput.style.display = checkbox.checked ? 'block' : 'none';
            }
        } else if (property === 'powerful') {
            const powerfulInput = document.getElementById(`${equipmentType}PowerfulInput`);
            if (powerfulInput) {
                powerfulInput.style.display = checkbox.checked ? 'block' : 'none';
            }
        } else if (property === 'cursed') {
            const cursedInput = document.getElementById(`${equipmentType}CursedInput`);
            if (cursedInput) {
                cursedInput.style.display = checkbox.checked ? 'block' : 'none';
                
                // If unchecked, reset the power level dropdown
                if (!checkbox.checked) {
                    const powerLevelSelect = document.getElementById(`${equipmentType}CursedPowerLevel`);
                    if (powerLevelSelect) {
                        powerLevelSelect.innerHTML = '<option value="">Choose Power Level...</option>';
                    }
                }
            }
        } else if (property === 'reliable') {
            // Toggling reliable property
            const reliableInput = document.getElementById(`${equipmentType}ReliableInput`);
            if (reliableInput) {
                // Found reliable input
                reliableInput.style.display = checkbox.checked ? 'block' : 'none';
                
                // If unchecked, reset the power level dropdown
                if (!checkbox.checked) {
                    const powerLevelSelect = document.getElementById(`${equipmentType}ReliablePowerLevel`);
                    if (powerLevelSelect) {
                        powerLevelSelect.innerHTML = '<option value="">Choose Power Level...</option>';
                    }
                }
            } else {
                console.warn(`❌ No reliable input found for ${equipmentType}`);
            }
        } else if (property === 'persistent') {
            const persistentInput = document.getElementById(`${equipmentType}PersistentInput`);
            if (persistentInput) {
                persistentInput.style.display = checkbox.checked ? 'block' : 'none';
                
                // If unchecked, reset the power level dropdown
                if (!checkbox.checked) {
                    const powerLevelSelect = document.getElementById(`${equipmentType}PersistentPowerLevel`);
                    if (powerLevelSelect) {
                        powerLevelSelect.innerHTML = '<option value="">Choose Power Level...</option>';
                    }
                }
            }
        }
    }

    // Toggle weapon property-specific inputs
    toggleWeaponPropertyInputs() {
        const defensiveCheckbox = document.getElementById('weaponDefensive');
        const deadlyCheckbox = document.getElementById('weaponDeadly');
        const damageTypeCheckbox = document.getElementById('weaponDamageType');
        const banefulCheckbox = document.getElementById('weaponBaneful');
        const defensiveValueInput = document.getElementById('defensiveValueInput');
        const deadlyValueInput = document.getElementById('deadlyValueInput');
        const damageTypeInput = document.getElementById('weaponDamageTypeInput');
        const banefulInput = document.getElementById('weaponBanefulInput');
        
        if (defensiveValueInput) {
            defensiveValueInput.style.display = defensiveCheckbox.checked ? 'block' : 'none';
        }
        
        if (deadlyValueInput) {
            deadlyValueInput.style.display = deadlyCheckbox.checked ? 'block' : 'none';
        }
        
        if (damageTypeInput) {
            damageTypeInput.style.display = damageTypeCheckbox.checked ? 'block' : 'none';
        }
        
        if (banefulInput) {
            banefulInput.style.display = banefulCheckbox.checked ? 'block' : 'none';
        }
    }

    // Add universal properties to equipment
    addUniversalProperties(equipment, type) {
        equipment.universalProperties = [];
        
        // Area property
        if (document.getElementById(`${type}Area`).checked) {
            equipment.universalProperties.push('area');
            equipment.areaSize = document.getElementById(`${type}AreaSize`).value;
        }
        
        // Autonomous property
        if (document.getElementById(`${type}Autonomous`).checked) {
            equipment.universalProperties.push('autonomous');
        }
        
        // Consumable property
        if (document.getElementById(`${type}Consumable`).checked) {
            equipment.universalProperties.push('consumable');
        }
        
        // Cursed property
        if (document.getElementById(`${type}Cursed`).checked) {
            equipment.universalProperties.push('cursed');
            equipment.cursedBane = document.getElementById(`${type}CursedBane`).value;
            equipment.cursedPowerLevel = parseInt(document.getElementById(`${type}CursedPowerLevel`).value) || 1;
        }
        
        // Persistent property
        if (document.getElementById(`${type}Persistent`).checked) {
            equipment.universalProperties.push('persistent');
            equipment.persistentBoon = document.getElementById(`${type}PersistentBoon`).value;
            equipment.persistentPowerLevel = parseInt(document.getElementById(`${type}PersistentPowerLevel`).value) || 1;
        }
        
        // Expendable property
        if (document.getElementById(`${type}Expendable`).checked) {
            equipment.universalProperties.push('expendable');
        }
        
        // Powerful property
        if (document.getElementById(`${type}Powerful`).checked) {
            equipment.universalProperties.push('powerful');
            equipment.powerfulValue = parseInt(document.getElementById(`${type}PowerfulValue`).value) || 1;
        }
        
        // Reliable property
        if (document.getElementById(`${type}Reliable`).checked) {
            equipment.universalProperties.push('reliable');
            equipment.reliableBoon = document.getElementById(`${type}ReliableBoon`).value;
            equipment.reliablePowerLevel = parseInt(document.getElementById(`${type}ReliablePowerLevel`).value) || 1;
        }
        
        // Sentient property
        if (document.getElementById(`${type}Sentient`).checked) {
            equipment.universalProperties.push('sentient');
        }
    }

    // Clear universal properties for equipment type
    clearUniversalProperties(type) {
        // Clear all universal property checkboxes
        document.getElementById(`${type}Area`).checked = false;
        document.getElementById(`${type}Autonomous`).checked = false;
        document.getElementById(`${type}Consumable`).checked = false;
        document.getElementById(`${type}Cursed`).checked = false;
        document.getElementById(`${type}Persistent`).checked = false;
        document.getElementById(`${type}Expendable`).checked = false;
        document.getElementById(`${type}Powerful`).checked = false;
        document.getElementById(`${type}Reliable`).checked = false;
        document.getElementById(`${type}Sentient`).checked = false;
        
        // Clear property-specific inputs
        document.getElementById(`${type}AreaSize`).value = '';
        document.getElementById(`${type}PowerfulValue`).value = '1';
        document.getElementById(`${type}CursedBane`).value = '';
        document.getElementById(`${type}CursedPowerLevel`).value = '';
        document.getElementById(`${type}PersistentBoon`).value = '';
        document.getElementById(`${type}PersistentPowerLevel`).value = '';
        
        // Reset power level dropdowns to default state
        const cursedPowerLevelSelect = document.getElementById(`${type}CursedPowerLevel`);
        if (cursedPowerLevelSelect) {
            cursedPowerLevelSelect.innerHTML = '<option value="">Choose Power Level...</option>';
        }
        const persistentPowerLevelSelect = document.getElementById(`${type}PersistentPowerLevel`);
        if (persistentPowerLevelSelect) {
            persistentPowerLevelSelect.innerHTML = '<option value="">Choose Power Level...</option>';
        }
        
        // Hide all property-specific inputs
        document.getElementById(`${type}AreaSizeInput`).style.display = 'none';
        document.getElementById(`${type}PowerfulInput`).style.display = 'none';
        document.getElementById(`${type}CursedInput`).style.display = 'none';
        document.getElementById(`${type}PersistentInput`).style.display = 'none';
    }

    // Populate weapon bane dropdowns
    populateWeaponBanesDropdowns() {
        if (!window.GAME_DATABASE || !window.GAME_DATABASE.banes) return;
        
        const baneSelects = [
            document.getElementById('weaponBane1'),
            document.getElementById('weaponBane2'),
            document.getElementById('weaponBane3')
        ];
        
        // Combine official and custom banes
        const allBanes = [...window.GAME_DATABASE.banes];
        if (this.customBanes && this.customBanes.length > 0) {
            allBanes.push(...this.customBanes);
        }
        const sortedBanes = this.sortItemsAlphabetically(allBanes);
        
        baneSelects.forEach(select => {
            if (select) {
                // Clear existing options except the first one
                select.innerHTML = '<option value="">No Bane</option>';
                
                // Sort banes alphabetically and add to dropdown
                sortedBanes.forEach(bane => {
                    const option = document.createElement('option');
                    option.value = bane.name;
                    option.textContent = bane.isCustom ? `${bane.name} (Custom)` : bane.name;
                    select.appendChild(option);
                });
            }
        });
        
        // Also populate universal cursed bane dropdowns
        this.populateUniversalCursedBanes();
        
        // Populate universal persistent boon dropdowns
        this.populateUniversalPersistentBoons();
        
        // Populate universal reliable boon dropdowns
        console.log('🔧 About to populate universal reliable boons...');
        this.populateUniversalReliableBoons();
        
        // Populate baneful bane dropdown
        this.populateBanefulBaneDropdown();
    }

    // Populate baneful bane dropdown
    populateBanefulBaneDropdown() {
        if (!window.GAME_DATABASE || !window.GAME_DATABASE.banes) return;
        
        // Combine official and custom banes
        const allBanes = [...window.GAME_DATABASE.banes];
        if (this.customBanes && this.customBanes.length > 0) {
            allBanes.push(...this.customBanes);
        }
        const sortedBanes = this.sortItemsAlphabetically(allBanes);
        
        const banefulBaneSelect = document.getElementById('weaponBanefulSelect');
        if (banefulBaneSelect) {
            // Clear existing options except the first one
            banefulBaneSelect.innerHTML = '<option value="">Choose a bane...</option>';
            
            // Add all banes to dropdown
            sortedBanes.forEach(bane => {
                const option = document.createElement('option');
                option.value = bane.name;
                option.textContent = bane.isCustom ? `${bane.name} (Custom)` : bane.name;
                banefulBaneSelect.appendChild(option);
            });
        }
    }

    // Populate universal persistent boon dropdowns
    populateUniversalPersistentBoons() {
        if (!window.GAME_DATABASE || !window.GAME_DATABASE.boons) return;
        
        const equipmentTypes = ['item', 'weapon', 'armor'];
        
        // Combine official and custom boons
        const allBoons = [...window.GAME_DATABASE.boons];
        if (this.customBoons && this.customBoons.length > 0) {
            allBoons.push(...this.customBoons);
        }
        const sortedBoons = this.sortItemsAlphabetically(allBoons);
        
        equipmentTypes.forEach(type => {
            const persistentBoonSelect = document.getElementById(`${type}PersistentBoon`);
            if (persistentBoonSelect) {
                // Clear existing options except the first one
                persistentBoonSelect.innerHTML = '<option value="">Choose a boon...</option>';
                
                // Add all boons to dropdown
                sortedBoons.forEach(boon => {
                    const option = document.createElement('option');
                    option.value = boon.name;
                    option.textContent = boon.isCustom ? `${boon.name} (Custom)` : boon.name;
                    persistentBoonSelect.appendChild(option);
                });
            }
        });
    }

    // Populate universal reliable boon dropdowns
    populateUniversalReliableBoons() {
        // populateUniversalReliableBoons called
        
        if (!window.GAME_DATABASE || !window.GAME_DATABASE.boons) {
            console.warn('Game database or boons not available');
            return;
        }
        
        // Populating universal reliable boon dropdowns...
        
        const equipmentTypes = ['item', 'weapon', 'armor'];
        
        // Combine official and custom boons
        const allBoons = [...window.GAME_DATABASE.boons];
        if (this.customBoons && this.customBoons.length > 0) {
            allBoons.push(...this.customBoons);
        }
        const sortedBoons = this.sortItemsAlphabetically(allBoons);
        
        equipmentTypes.forEach(type => {
            const reliableBoonSelect = document.getElementById(`${type}ReliableBoon`);
            if (reliableBoonSelect) {
                // Found reliable boon select
                // Clear existing options except the first one
                reliableBoonSelect.innerHTML = '<option value="">Choose a boon...</option>';
                
                // Add all boons to dropdown
                sortedBoons.forEach(boon => {
                    const option = document.createElement('option');
                    option.value = boon.name;
                    option.textContent = boon.isCustom ? `${boon.name} (Custom)` : boon.name;
                    reliableBoonSelect.appendChild(option);
                });
                
                // Added boon options
            } else {
                console.warn(`No reliable boon select found for ${type}`);
            }
        });
    }

    // Populate universal cursed bane dropdowns
    populateUniversalCursedBanes() {
        if (!window.GAME_DATABASE || !window.GAME_DATABASE.banes) return;
        
        const equipmentTypes = ['item', 'weapon', 'armor'];
        
        // Combine official and custom banes
        const allBanes = [...window.GAME_DATABASE.banes];
        if (this.customBanes && this.customBanes.length > 0) {
            allBanes.push(...this.customBanes);
        }
        const sortedBanes = this.sortItemsAlphabetically(allBanes);
        
        equipmentTypes.forEach(type => {
            const cursedBaneSelect = document.getElementById(`${type}CursedBane`);
            if (cursedBaneSelect) {
                // Clear existing options except the first one
                cursedBaneSelect.innerHTML = '<option value="">Choose a bane...</option>';
                
                // Add all banes to dropdown
                sortedBanes.forEach(bane => {
                    const option = document.createElement('option');
                    option.value = bane.name;
                    option.textContent = bane.isCustom ? `${bane.name} (Custom)` : bane.name;
                    cursedBaneSelect.appendChild(option);
                });
            }
        });
    }

    // Update cursed bane power level options based on selected bane
    updateCursedBanePowerLevels(equipmentType) {
        const baneSelect = document.getElementById(`${equipmentType}CursedBane`);
        const powerLevelSelect = document.getElementById(`${equipmentType}CursedPowerLevel`);
        
        if (!baneSelect || !powerLevelSelect) return;
        
        const selectedBaneName = baneSelect.value;
        
        // Clear existing power level options
        powerLevelSelect.innerHTML = '<option value="">Choose Power Level...</option>';
        
        if (!selectedBaneName) {
            return; // No bane selected
        }
        
        // Find the selected bane in database or custom banes
        let selectedBane = window.GAME_DATABASE.banes.find(bane => bane.name === selectedBaneName);
        if (!selectedBane && this.customBanes) {
            selectedBane = this.customBanes.find(bane => bane.name === selectedBaneName);
        }
        
        if (selectedBane && selectedBane.powerLevels) {
            // Add power level options based on the selected bane's available power levels
            selectedBane.powerLevels.forEach(powerLevel => {
                const option = document.createElement('option');
                option.value = powerLevel;
                option.textContent = `Power Level ${powerLevel}`;
                powerLevelSelect.appendChild(option);
            });
            
            // Updated power levels for bane
        } else {
            console.warn(`No power levels found for bane: ${selectedBaneName}`);
        }
    }

    // Update persistent boon power level options based on selected boon
    updatePersistentBoonPowerLevels(equipmentType) {
        const boonSelect = document.getElementById(`${equipmentType}PersistentBoon`);
        const powerLevelSelect = document.getElementById(`${equipmentType}PersistentPowerLevel`);
        
        if (!boonSelect || !powerLevelSelect) return;
        
        const selectedBoonName = boonSelect.value;
        
        // Clear existing power level options
        powerLevelSelect.innerHTML = '<option value="">Choose Power Level...</option>';
        
        if (!selectedBoonName) {
            return; // No boon selected
        }
        
        // Find the selected boon in database or custom boons
        let selectedBoon = window.GAME_DATABASE.boons.find(boon => boon.name === selectedBoonName);
        if (!selectedBoon && this.customBoons) {
            selectedBoon = this.customBoons.find(boon => boon.name === selectedBoonName);
        }
        
        if (selectedBoon && selectedBoon.powerLevels) {
            // Add power level options based on the selected boon's available power levels
            selectedBoon.powerLevels.forEach(powerLevel => {
                const option = document.createElement('option');
                option.value = powerLevel;
                option.textContent = `Power Level ${powerLevel}`;
                powerLevelSelect.appendChild(option);
            });
            
            // Updated power levels for boon
        } else {
            console.warn(`No power levels found for boon: ${selectedBoonName}`);
        }
    }

    // Update reliable boon power level options based on selected boon
    updateReliableBoonPowerLevels(equipmentType) {
        const boonSelect = document.getElementById(`${equipmentType}ReliableBoon`);
        const powerLevelSelect = document.getElementById(`${equipmentType}ReliablePowerLevel`);
        
        if (!boonSelect || !powerLevelSelect) return;
        
        const selectedBoonName = boonSelect.value;
        
        // Clear existing power level options
        powerLevelSelect.innerHTML = '<option value="">Choose Power Level...</option>';
        
        if (!selectedBoonName) {
            return; // No boon selected
        }
        
        // Find the selected boon in database or custom boons
        let selectedBoon = window.GAME_DATABASE.boons.find(boon => boon.name === selectedBoonName);
        if (!selectedBoon && this.customBoons) {
            selectedBoon = this.customBoons.find(boon => boon.name === selectedBoonName);
        }
        
        if (selectedBoon && selectedBoon.powerLevels) {
            // Add power level options based on the selected boon's available power levels
            selectedBoon.powerLevels.forEach(powerLevel => {
                const option = document.createElement('option');
                option.value = powerLevel;
                option.textContent = `Power Level ${powerLevel}`;
                powerLevelSelect.appendChild(option);
            });
            
            // Updated power levels for reliable boon
        } else {
            console.warn(`No power levels found for reliable boon: ${selectedBoonName}`);
        }
    }

    // Add cursed bane to active banes when cursed item is equipped
    addCursedBane(equipment) {
        // addCursedBane called with equipment
        
        if (!this.currentCharacter) {
            console.warn('No current character found');
            return;
        }
        
        if (!equipment.cursedBane) {
            console.warn('No cursed bane found on equipment');
            return;
        }
        
        if (!equipment.cursedPowerLevel) {
            console.warn('No cursed power level found on equipment');
            return;
        }
        
        // Find the bane in the database
        const baneData = window.GAME_DATABASE.banes.find(b => b.name === equipment.cursedBane);
        if (!baneData) {
            console.warn('Bane not found in database:', equipment.cursedBane);
            return;
        }
        
        // Found bane data
        
        // Validate that the power level is valid for this bane
        if (!baneData.powerLevels || !baneData.powerLevels.includes(equipment.cursedPowerLevel)) {
            console.warn('Invalid power level for bane:', {
                bane: equipment.cursedBane,
                selectedPowerLevel: equipment.cursedPowerLevel,
                availablePowerLevels: baneData.powerLevels
            });
            this.showNotification(`Invalid power level ${equipment.cursedPowerLevel} for bane "${equipment.cursedBane}". Available: ${baneData.powerLevels.join(', ')}`, 'error');
            return;
        }
        
        // Create cursed bane entry with full database information
        const cursedBane = {
            id: `cursed_${equipment.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: equipment.cursedBane,
            powerLevel: equipment.cursedPowerLevel,
            duration: 'Sustained',
            source: `Cursed ${equipment.name}`,
            removable: false, // Cannot be removed while item is equipped
            equipmentId: equipment.id,
            isCursed: true, // Flag to identify this as a cursed bane
            // Include database bane information for proper display
            effectDescription: baneData.effectDescription,
            powerLevels: baneData.powerLevels,
            powerLevelDescriptions: baneData.powerLevelDescriptions,
            resists: baneData.resists || []
        };
        
        // Add to banes (the array that gets displayed)
        if (!this.currentCharacter.banes) {
            this.currentCharacter.banes = [];
        }
        
        // Remove any existing cursed bane from this equipment
        this.currentCharacter.banes = this.currentCharacter.banes.filter(b => b.equipmentId !== equipment.id);
        
        // Add the new cursed bane
        this.currentCharacter.banes.push(cursedBane);
        
        // Cursed bane added successfully
        // Current banes updated
        
        // Refresh the banes display to show the new cursed bane
        this.populateBanes();
        
        // After populateBanes, checking if bane is visible...
        const baneElements = document.querySelectorAll('.bane-item');
        // Found bane elements
        
        this.showNotification(`Cursed bane "${equipment.cursedBane}" (PL ${equipment.cursedPowerLevel}) applied from ${equipment.name}!`, 'warning');
    }

    // Remove cursed bane from banes when cursed item is unequipped
    removeCursedBane(equipment) {
        if (!this.currentCharacter || !this.currentCharacter.banes) return;
        
        // Remove cursed bane from this equipment using equipmentId
        this.currentCharacter.banes = this.currentCharacter.banes.filter(b => b.equipmentId !== equipment.id);
        
        // Cursed bane removed
        
        // Refresh the banes display to remove the cursed bane
        this.populateBanes();
        
        this.showNotification(`Cursed bane from ${equipment.name} removed!`, 'info');
    }

    // Add persistent boon to available boons when persistent item is equipped
    addPersistentBoon(equipment) {
        // addPersistentBoon called with equipment
        // Equipment persistent properties
        
        if (!this.currentCharacter) {
            console.warn('⚠️ No current character found');
            return;
        }
        
        if (!equipment.persistentBoon) {
            console.warn('⚠️ No persistent boon found on equipment');
            return;
        }
        
        if (!equipment.persistentPowerLevel) {
            console.warn('⚠️ No persistent power level found on equipment');
            return;
        }
        
        // Find the boon in the database
        const boonData = window.GAME_DATABASE.boons.find(b => b.name === equipment.persistentBoon);
        if (!boonData) {
            console.warn('⚠️ Boon not found in database:', equipment.persistentBoon);
            return;
        }
        
        console.log('✅ Found boon data:', boonData);
        console.log('🔍 Boon data fields:', {
            generalDescription: boonData.generalDescription,
            effectDescription: boonData.effectDescription,
            invocationTime: boonData.invocationTime,
            powerLevelDescriptions: boonData.powerLevelDescriptions
        });
        
        // Validate that the power level is valid for this boon
        if (!boonData.powerLevels || !boonData.powerLevels.includes(equipment.persistentPowerLevel)) {
            console.warn('⚠️ Invalid power level for boon:', {
                boon: equipment.persistentBoon,
                selectedPowerLevel: equipment.persistentPowerLevel,
                availablePowerLevels: boonData.powerLevels
            });
            this.showNotification(`Invalid power level ${equipment.persistentPowerLevel} for boon "${equipment.persistentBoon}". Available: ${boonData.powerLevels.join(', ')}`, 'error');
            return;
        }
        
        // Create persistent boon entry with full database information
        const persistentBoon = {
            id: `persistent_${equipment.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: equipment.persistentBoon,
            powerLevel: equipment.persistentPowerLevel, // Single power level for this instance
            powerLevels: [equipment.persistentPowerLevel], // Array for compatibility with display functions
            duration: 'Sustained',
            source: `Persistent ${equipment.name}`,
            removable: false, // Cannot be removed while item is equipped
            equipmentId: equipment.id,
            isPersistent: true, // Flag to identify this as a persistent boon
            // Include database boon information for proper display
            generalDescription: boonData.generalDescription,
            effectDescription: boonData.effectDescription,
            invocationTime: boonData.invocationTime,
            powerLevelDescriptions: boonData.powerLevelDescriptions,
            resists: boonData.resists || []
        };
        
        console.log('🔍 Created persistent boon object:', persistentBoon);
        
        // Add to available boons (the array that gets displayed)
        if (!this.currentCharacter.availableBoons) {
            this.currentCharacter.availableBoons = [];
        }
        
        // Remove any existing persistent boon from this equipment
        this.currentCharacter.availableBoons = this.currentCharacter.availableBoons.filter(b => b.equipmentId !== equipment.id);
        
        // Add the new persistent boon
        this.currentCharacter.availableBoons.push(persistentBoon);
        
        // Also add to active boons (currently active effects)
        if (!this.currentCharacter.boons) {
            this.currentCharacter.boons = [];
        }
        
        // Remove any existing boon with the same name (to avoid duplicates)
        this.currentCharacter.boons = this.currentCharacter.boons.filter(b => b.name !== persistentBoon.name);
        
        // Create active boon entry
        const activeBoon = {
            name: persistentBoon.name,
            duration: 'Sustained', // Persistent boons are always sustained
            powerLevel: persistentBoon.powerLevel,
            sustaining: true, // Always sustaining since it's from equipment
            source: `Persistent ${equipment.name}`, // Track the source
            equipmentId: equipment.id, // Track which equipment this came from
            isPersistent: true // Flag to identify this as a persistent boon
        };
        
        this.currentCharacter.boons.push(activeBoon);
        
        console.log('✅ Persistent boon added successfully:', persistentBoon);
        console.log('✅ Active boon added successfully:', activeBoon);
        console.log('✅ Current available boons:', this.currentCharacter.availableBoons);
        console.log('✅ Current active boons:', this.currentCharacter.boons);
        
        // Refresh both displays
        console.log('🔄 Refreshing boons displays...');
        this.populateAvailableBoons();
        this.populateBoons();
        
        // Double-check that the boon is now in both arrays
        const finalCheckAvailable = this.currentCharacter.availableBoons.find(b => b.equipmentId === equipment.id);
        const finalCheckActive = this.currentCharacter.boons.find(b => b.equipmentId === equipment.id);
        console.log('🔍 Final check - persistent boon in available boons:', finalCheckAvailable);
        console.log('🔍 Final check - persistent boon in active boons:', finalCheckActive);
        
        this.showNotification(`Persistent boon "${equipment.persistentBoon}" (PL ${equipment.persistentPowerLevel}) applied from ${equipment.name}!`, 'success');
    }

    // Add reliable boon to available boons when reliable item is equipped
    addReliableBoon(equipment) {
        console.log('🔍 addReliableBoon called with equipment:', equipment);
        console.log('🔍 Equipment reliable properties:', {
            hasUniversalProperties: !!equipment.universalProperties,
            universalProperties: equipment.universalProperties,
            hasReliable: equipment.universalProperties && equipment.universalProperties.includes('reliable'),
            reliableBoon: equipment.reliableBoon,
            reliablePowerLevel: equipment.reliablePowerLevel
        });
        
        if (!this.currentCharacter) {
            console.warn('⚠️ No current character found');
            return;
        }
        
        if (!equipment.reliableBoon) {
            console.warn('⚠️ No reliable boon found on equipment');
            return;
        }
        
        if (!equipment.reliablePowerLevel) {
            console.warn('⚠️ No reliable power level found on equipment');
            return;
        }
        
        // Find the boon in the database
        const boonData = window.GAME_DATABASE.boons.find(b => b.name === equipment.reliableBoon);
        if (!boonData) {
            console.warn('⚠️ Boon not found in database:', equipment.reliableBoon);
            return;
        }
        
        console.log('✅ Found boon data:', boonData);
        
        // Validate that the power level is valid for this boon
        if (!boonData.powerLevels || !boonData.powerLevels.includes(equipment.reliablePowerLevel)) {
            console.warn('⚠️ Invalid power level for boon:', {
                boon: equipment.reliableBoon,
                selectedPowerLevel: equipment.reliablePowerLevel,
                availablePowerLevels: boonData.powerLevels
            });
            this.showNotification(`Invalid power level ${equipment.reliablePowerLevel} for boon "${equipment.reliableBoon}". Available: ${boonData.powerLevels.join(', ')}`, 'error');
            return;
        }
        
        // Create reliable boon entry with full database information
        const reliableBoon = {
            id: `reliable_${equipment.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: equipment.reliableBoon,
            powerLevel: equipment.reliablePowerLevel,
            powerLevels: [equipment.reliablePowerLevel],
            duration: 'Sustained',
            source: `Reliable ${equipment.name}`,
            removable: false, // Cannot be removed while item is equipped
            equipmentId: equipment.id,
            isReliable: true, // Flag to identify this as a reliable boon
            // Include database boon information for proper display
            generalDescription: boonData.generalDescription,
            effectDescription: boonData.effectDescription,
            invocationTime: boonData.invocationTime,
            powerLevelDescriptions: boonData.powerLevelDescriptions,
            resists: boonData.resists || [],
            // Add attributes for compatibility with display functions
            attributes: boonData.attributes || []
        };
        
        console.log('🔍 Created reliable boon object:', reliableBoon);
        
        // Add to available boons (the array that gets displayed)
        if (!this.currentCharacter.availableBoons) {
            this.currentCharacter.availableBoons = [];
        }
        
        // Remove any existing reliable boon from this equipment
        this.currentCharacter.availableBoons = this.currentCharacter.availableBoons.filter(b => b.equipmentId !== equipment.id);
        
        // Add the new reliable boon
        this.currentCharacter.availableBoons.push(reliableBoon);
        
        console.log('✅ Reliable boon added successfully:', reliableBoon);
        console.log('✅ Current available boons:', this.currentCharacter.availableBoons);
        
        // Refresh available boons display
        console.log('🔄 Refreshing available boons display...');
        this.populateAvailableBoons();
        
        // Double-check that the boon is now in available boons
        const finalCheckAvailable = this.currentCharacter.availableBoons.find(b => b.equipmentId === equipment.id);
        console.log('🔍 Final check - reliable boon in available boons:', finalCheckAvailable);
        
        this.showNotification(`Reliable boon "${equipment.reliableBoon}" (PL ${equipment.reliablePowerLevel}) added to available boons from ${equipment.name}!`, 'success');
    }

    // Remove persistent boon from available boons when persistent item is unequipped
    removePersistentBoon(equipment) {
        if (!this.currentCharacter) return;
        
        // Remove persistent boon from available boons
        if (this.currentCharacter.availableBoons) {
            this.currentCharacter.availableBoons = this.currentCharacter.availableBoons.filter(b => b.equipmentId !== equipment.id);
        }
        
        // Remove persistent boon from active boons
        if (this.currentCharacter.boons) {
            this.currentCharacter.boons = this.currentCharacter.boons.filter(b => b.equipmentId !== equipment.id);
        }
        
        console.log('✅ Persistent boon removed from both arrays:', equipment.name);
        
        // Refresh both displays
        this.populateAvailableBoons();
        this.populateBoons();
        
        this.showNotification(`Persistent boon from ${equipment.name} removed!`, 'info');
    }

    // Remove reliable boon from available boons when reliable item is unequipped
    removeReliableBoon(equipment) {
        if (!this.currentCharacter) return;
        
        // Remove reliable boon from available boons
        if (this.currentCharacter.availableBoons) {
            this.currentCharacter.availableBoons = this.currentCharacter.availableBoons.filter(b => b.equipmentId !== equipment.id);
        }
        
        console.log('✅ Reliable boon removed from available boons:', equipment.name);
        
        // Refresh available boons display
        this.populateAvailableBoons();
        
        this.showNotification(`Reliable boon from ${equipment.name} removed!`, 'info');
    }

    // Clean up orphaned cursed banes (banes whose source equipment no longer exists)
    cleanupOrphanedCursedBanes() {
        if (!this.currentCharacter || !this.currentCharacter.banes) return;
        
        const orphanedBanes = this.currentCharacter.banes.filter(bane => 
            bane.isCursed && 
            bane.equipmentId && 
            !this.currentCharacter.equipment.find(e => e.id === bane.equipmentId)
        );
        
        if (orphanedBanes.length > 0) {
            console.log('🧹 Cleaning up orphaned cursed banes:', orphanedBanes.map(b => b.name));
            this.currentCharacter.banes = this.currentCharacter.banes.filter(bane => 
                !(bane.isCursed && 
                  bane.equipmentId && 
                  !this.currentCharacter.equipment.find(e => e.id === bane.equipmentId))
            );
            
            // Refresh the display
            this.populateBanes();
        }
    }

    // Clean up orphaned persistent boons (boons whose source equipment no longer exists)
    cleanupOrphanedPersistentBoons() {
        if (!this.currentCharacter) return;
        
        // Clean up orphaned boons from available boons
        let orphanedAvailableBoons = [];
        if (this.currentCharacter.availableBoons) {
            orphanedAvailableBoons = this.currentCharacter.availableBoons.filter(boon => 
                (boon.isPersistent || boon.isReliable) && 
                boon.equipmentId && 
                !this.currentCharacter.equipment.find(e => e.id === boon.equipmentId)
            );
            
            if (orphanedAvailableBoons.length > 0) {
                console.log('🧹 Cleaning up orphaned persistent/reliable boons from available boons:', orphanedAvailableBoons.map(b => b.name));
                this.currentCharacter.availableBoons = this.currentCharacter.availableBoons.filter(boon => 
                    !((boon.isPersistent || boon.isReliable) && 
                      boon.equipmentId && 
                      !this.currentCharacter.equipment.find(e => e.id === boon.equipmentId))
                );
            }
        }
        
        // Clean up orphaned boons from active boons
        let orphanedActiveBoons = [];
        if (this.currentCharacter.boons) {
            orphanedActiveBoons = this.currentCharacter.boons.filter(boon => 
                boon.isPersistent && 
                boon.equipmentId && 
                !this.currentCharacter.equipment.find(e => e.id === boon.equipmentId)
            );
            
            if (orphanedActiveBoons.length > 0) {
                console.log('🧹 Cleaning up orphaned persistent boons from active boons:', orphanedActiveBoons.map(b => b.name));
                this.currentCharacter.boons = this.currentCharacter.boons.filter(boon => 
                    !(boon.isPersistent && 
                      boon.equipmentId && 
                      !this.currentCharacter.equipment.find(e => e.id === boon.equipmentId))
                );
            }
        }
        
        // Refresh both displays if any cleanup was done
        if (orphanedAvailableBoons.length > 0 || orphanedActiveBoons.length > 0) {
            this.populateAvailableBoons();
            this.populateBoons();
        }
    }

    // Comprehensive validation function to check for orphaned boons and banes
    validateBoonsAndBanes() {
        if (!this.currentCharacter) return;
        
        console.log('🔍 Validating boons and banes for data integrity...');
        
        let issuesFound = false;
        
        // Validate cursed banes
        if (this.currentCharacter.banes) {
            const orphanedBanes = this.currentCharacter.banes.filter(bane => 
                bane.isCursed && 
                bane.equipmentId && 
                !this.currentCharacter.equipment.find(e => e.id === bane.equipmentId)
            );
            
            if (orphanedBanes.length > 0) {
                console.log('⚠️ Found orphaned cursed banes:', orphanedBanes.map(b => b.name));
                issuesFound = true;
                this.cleanupOrphanedCursedBanes();
            }
        }
        
        // Validate persistent and reliable boons
        if (this.currentCharacter.availableBoons || this.currentCharacter.boons) {
            const orphanedAvailableBoons = this.currentCharacter.availableBoons?.filter(boon => 
                (boon.isPersistent || boon.isReliable) && 
                boon.equipmentId && 
                !this.currentCharacter.equipment.find(e => e.id === boon.equipmentId)
            ) || [];
            
            const orphanedActiveBoons = this.currentCharacter.boons?.filter(boon => 
                boon.isPersistent && 
                boon.equipmentId && 
                !this.currentCharacter.equipment.find(e => e.id === boon.equipmentId)
            ) || [];
            
            if (orphanedAvailableBoons.length > 0 || orphanedActiveBoons.length > 0) {
                console.log('⚠️ Found orphaned persistent/reliable boons:', {
                    available: orphanedAvailableBoons.map(b => b.name),
                    active: orphanedActiveBoons.map(b => b.name)
                });
                issuesFound = true;
                this.cleanupOrphanedPersistentBoons();
            }
        }
        
        if (issuesFound) {
            console.log('✅ Validation complete - orphaned items cleaned up');
            this.autoSave(); // Save the cleaned up data
        } else {
            console.log('✅ Validation complete - no issues found');
        }
        
        return issuesFound;
    }

    // Start periodic validation of boons and banes
    startPeriodicValidation() {
        // Clear any existing interval
        if (this.validationInterval) {
            clearInterval(this.validationInterval);
        }
        
        // Set up validation every 5 minutes (300,000 ms)
        this.validationInterval = setInterval(() => {
            if (this.currentCharacter) {
                console.log('⏰ Running periodic validation...');
                this.validateBoonsAndBanes();
            }
        }, 300000); // 5 minutes
        
        console.log('🔄 Periodic validation started (every 5 minutes)');
    }

    // Stop periodic validation
    stopPeriodicValidation() {
        if (this.validationInterval) {
            clearInterval(this.validationInterval);
            this.validationInterval = null;
            console.log('🛑 Periodic validation stopped');
        }
    }

    // Clear weapon fields after creation
    clearWeaponFields() {
        // Clear weapon category dropdown
        const weaponCategory = document.getElementById('weaponCategory');
        if (weaponCategory) weaponCategory.value = '';
        
        // Clear range increment
        const weaponRangeIncrement = document.getElementById('weaponRangeIncrement');
        if (weaponRangeIncrement) weaponRangeIncrement.value = '';
        
        // Clear wealth level
        const weaponWealthLevel = document.getElementById('weaponWealthLevel');
        if (weaponWealthLevel) weaponWealthLevel.value = '0';
        
        // Clear all property checkboxes
        const checkboxes = [
            'weaponArea', 'weaponExpendable', 'weaponDefensive', 'weaponDeadly', 
            'weaponDamageType', 'weaponBaneful', 'weaponDelayedReady', 'weaponForceful', 'weaponHeavy',
            'weaponPrecise', 'weaponReach', 'weaponSlow', 'weaponStationary', 'weaponSwift'
        ];
        
        checkboxes.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) checkbox.checked = false;
        });
        
        // Clear property-specific inputs
        const areaSize = document.getElementById('weaponAreaSize');
        const defensiveValue = document.getElementById('weaponDefensiveValue');
        const deadlyValue = document.getElementById('weaponDeadlyValue');
        const damageTypeSelect = document.getElementById('weaponDamageTypeSelect');
        const banefulSelect = document.getElementById('weaponBanefulSelect');
        
        if (areaSize) areaSize.value = '';
        if (defensiveValue) defensiveValue.value = '1';
        if (deadlyValue) deadlyValue.value = '1';
        if (damageTypeSelect) damageTypeSelect.value = '';
        if (banefulSelect) banefulSelect.value = '';
        
        // Hide property-specific inputs
        const areaSizeInput = document.getElementById('weaponAreaSizeInput');
        const defensiveValueInput = document.getElementById('weaponDefensiveValueInput');
        const deadlyValueInput = document.getElementById('weaponDeadlyValueInput');
        const damageTypeInput = document.getElementById('weaponDamageTypeInput');
        const banefulInput = document.getElementById('weaponBanefulInput');
        
        if (areaSizeInput) areaSizeInput.style.display = 'none';
        if (defensiveValueInput) defensiveValueInput.style.display = 'none';
        if (deadlyValueInput) deadlyValueInput.style.display = 'none';
        if (damageTypeInput) damageTypeInput.style.display = 'none';
        if (banefulInput) banefulInput.style.display = 'none';
        
        // Clear bane selections
        const bane1 = document.getElementById('weaponBane1');
        const bane2 = document.getElementById('weaponBane2');
        const bane3 = document.getElementById('weaponBane3');
        if (bane1) bane1.value = '';
        if (bane2) bane2.value = '';
        if (bane3) bane3.value = '';
        
        // Clear universal properties
        this.clearUniversalProperties('weapon');
    }

    // Clear item fields after creation
    clearItemFields() {
        // Clear attribute score selection
        document.getElementById('itemAttributeScore').value = 'none';
        
        // Clear power level selection
        document.getElementById('itemPowerLevel').value = '';
        
        // Clear wealth level
        document.getElementById('itemWealthLevel').value = '0';
        
        // Clear universal properties
        this.clearUniversalProperties('item');
    }

    // Format weapon category for display
    formatWeaponCategory(category) {
        if (!category) return 'No Melee';
        
        const categories = {
            'one-handed-melee': 'One-Handed Melee',
            'two-handed-melee': 'Two-Handed Melee',
            'versatile-melee': 'Versatile Melee'
        };
        return categories[category] || category;
    }

    // Format range increment for display
    formatRangeIncrement(range) {
        const ranges = {
            'close': 'Close Ranged (25\')',
            'short': 'Short Ranged (50\')',
            'medium': 'Medium Ranged (75\')',
            'long': 'Long Ranged (125\')',
            'extreme': 'Extreme Ranged (300\')'
        };
        return ranges[range] || range;
    }

    // Format weapon property for display
    formatWeaponProperty(property, item) {
        let displayText = '';
        switch (property) {
            case 'area':
                displayText = `Area (${item.areaSize || 'unknown size'})`;
                break;
            case 'defensive':
                displayText = `Defensive (${item.defensiveValue || 1})`;
                break;
            case 'deadly':
                displayText = `Deadly (${item.deadlyValue || 1})`;
                break;
            case 'damageType':
                displayText = `Damage Type (${item.damageType || 'unknown'})`;
                break;
            case 'baneful':
                displayText = `Baneful (${item.banefulBane || 'unknown'})`;
                break;
            default:
                displayText = property.charAt(0).toUpperCase() + property.slice(1);
        }
        
        // Return clickable HTML
        return `<span class="clickable-property" onclick="window.app.showPropertyPopup('${property}', 'weapon')" title="Click for description">${displayText}</span>`;
    }

    // Format universal properties for display
    formatUniversalProperties(item) {
        if (!item.universalProperties || item.universalProperties.length === 0) return '';
        
        return item.universalProperties.map(prop => {
            switch (prop) {
                case 'area':
                    return `Area (${item.areaSize || 'unknown size'})`;
                case 'powerful':
                    return `Powerful (${item.powerfulValue || 1})`;
                case 'cursed':
                    return `Cursed (${item.cursedBane || 'unknown'}, PL ${item.cursedPowerLevel || 1})`;
                case 'persistent':
                    return `Persistent (${item.persistentBoon || 'unknown'}, PL ${item.persistentPowerLevel || 1})`;
                default:
                    return prop.charAt(0).toUpperCase() + prop.slice(1);
            }
        }).join(', ');
    }

    // Format individual universal property for display
    formatUniversalProperty(prop, item) {
        let displayText = '';
        switch (prop) {
            case 'area':
                displayText = `Area (${item.areaSize || 'unknown size'})`;
                break;
            case 'powerful':
                displayText = `Powerful (${item.powerfulValue || 1})`;
                break;
            case 'cursed':
                displayText = `Cursed (${item.cursedBane || 'unknown'}, PL ${item.cursedPowerLevel || 1})`;
                break;
            case 'persistent':
                displayText = `Persistent (${item.persistentBoon || 'unknown'}, PL ${item.persistentPowerLevel || 1})`;
                break;
            case 'autonomous':
                displayText = 'Autonomous';
                break;
            case 'consumable':
                displayText = 'Consumable';
                break;
            case 'expendable':
                displayText = 'Expendable';
                break;
            case 'reliable':
                displayText = `Reliable (${item.reliableBoon || 'unknown'}, PL ${item.reliablePowerLevel || 1})`;
                break;
            case 'sentient':
                displayText = 'Sentient';
                break;
            default:
                displayText = prop.charAt(0).toUpperCase() + prop.slice(1);
        }
        
        // Return clickable HTML
        return `<span class="clickable-property" onclick="window.app.showPropertyPopup('${displayText}', 'universal')" title="Click for description">${displayText}</span>`;
    }

    // Show property description popup
    showPropertyPopup(propertyName, propertyType = 'weapon') {
        console.log('🔍 Property clicked:', { propertyName, propertyType });
        
        let title = '';
        let description = '';
        
        // Extract base property name (remove values in parentheses)
        const basePropertyName = propertyName.replace(/\s*\([^)]*\)/g, '').trim();
        console.log('🔍 Base property name:', basePropertyName);
        
        if (propertyType === 'weapon' && window.GAME_DATABASE && window.GAME_DATABASE.weaponProperties) {
            console.log('🔍 Available weapon properties:', Object.keys(window.GAME_DATABASE.weaponProperties));
            
            // Handle weapon properties
            if (window.GAME_DATABASE.weaponProperties[propertyName]) {
                title = propertyName;
                description = window.GAME_DATABASE.weaponProperties[propertyName];
                console.log('✅ Direct match found:', propertyName);
            } else if (window.GAME_DATABASE.weaponProperties[basePropertyName]) {
                // Try with base property name
                title = basePropertyName;
                description = window.GAME_DATABASE.weaponProperties[basePropertyName];
                console.log('✅ Base property match found:', basePropertyName);
            } else {
                // Try to find by partial match (e.g., "Extreme" for "Extreme Ranged")
                const matchingProperty = Object.keys(window.GAME_DATABASE.weaponProperties).find(key => {
                    const keyLower = key.toLowerCase();
                    const propLower = propertyName.toLowerCase();
                    const basePropLower = basePropertyName.toLowerCase();
                    
                    // Direct match
                    if (keyLower === propLower) return true;
                    if (keyLower === basePropLower) return true;
                    
                    // Partial matches for range properties
                    if (propLower.includes('range') || propLower.includes('ranged')) {
                        if (keyLower.includes('ranged') || keyLower.includes('range')) {
                            // Extract the range type (e.g., "Extreme" from "Extreme Ranged")
                            const rangeType = propLower.replace(/range|ranged/gi, '').trim();
                            if (keyLower.includes(rangeType.toLowerCase())) return true;
                        }
                    }
                    
                    // Other partial matches
                    return keyLower.includes(propLower) || propLower.includes(keyLower) ||
                           keyLower.includes(basePropLower) || basePropLower.includes(keyLower);
                });
                
                if (matchingProperty) {
                    title = matchingProperty;
                    description = window.GAME_DATABASE.weaponProperties[matchingProperty];
                    console.log('✅ Partial match found:', matchingProperty);
                } else {
                    console.log('❌ No match found for property:', propertyName);
                }
            }
        } else if (propertyType === 'universal') {
            console.log('🔍 Handling universal property:', propertyName);
            
            // Handle persistent boon information
            if (basePropertyName === 'persistent' && propertyName.includes('(')) {
                title = 'Persistent Property';
                const boonMatch = propertyName.match(/Persistent\s*\((.+?),\s*PL\s*(\d+)\)/);
                if (boonMatch) {
                    const boonName = boonMatch[1];
                    const powerLevel = boonMatch[2];
                    
                    // Try to find the boon in the database for more details
                    if (window.GAME_DATABASE && window.GAME_DATABASE.boons) {
                        const boonData = window.GAME_DATABASE.boons.find(b => b.name === boonName);
                        if (boonData) {
                            description = `
                                <strong>Persistent Property</strong><br><br>
                                <strong>Boon:</strong> ${boonName}<br>
                                <strong>Power Level:</strong> ${powerLevel}<br><br>
                                <strong>Property Description:</strong> ${window.GAME_DATABASE.weaponProperties.Persistent || 'No property description available'}<br><br>
                                <strong>Boon Description:</strong> ${boonData.generalDescription || 'No description available'}<br><br>
                                <strong>Effect:</strong> ${boonData.effectDescription || 'No effect description available'}<br><br>
                                <strong>Invocation Time:</strong> ${boonData.invocationTime || 'No invocation time specified'}<br><br>
                                <em>This boon is provided by equipment with the Persistent property. It is automatically active and sustained while the equipment is equipped.</em>
                            `;
                        } else {
                            description = `
                                <strong>Persistent Property</strong><br><br>
                                <strong>Boon:</strong> ${boonName}<br>
                                <strong>Power Level:</strong> ${powerLevel}<br><br>
                                <strong>Property Description:</strong> ${window.GAME_DATABASE.weaponProperties.Persistent || 'No property description available'}<br><br>
                                <em>This boon is provided by equipment with the Persistent property. It is automatically active and sustained while the equipment is equipped.</em>
                            `;
                        }
                    } else {
                        description = `
                            <strong>Persistent Property</strong><br><br>
                            <strong>Boon:</strong> ${boonName}<br>
                            <strong>Power Level:</strong> ${powerLevel}<br><br>
                            <strong>Property Description:</strong> ${window.GAME_DATABASE.weaponProperties.Persistent || 'No property description available'}<br><br>
                            <em>This boon is provided by equipment with the Persistent property. It is automatically active and sustained while the equipment is equipped.</em>
                        `;
                    }
                } else {
                    title = 'Persistent Property';
                    description = window.GAME_DATABASE.weaponProperties.Persistent || 'No description available for Persistent property.';
                }
            }
            // Handle reliable boon information
            else if (basePropertyName === 'reliable' && propertyName.includes('(')) {
                title = 'Reliable Property';
                const boonMatch = propertyName.match(/Reliable\s*\((.+?),\s*PL\s*(\d+)\)/);
                if (boonMatch) {
                    const boonName = boonMatch[1];
                    const powerLevel = boonMatch[2];
                    
                    // Try to find the boon in the database for more details
                    if (window.GAME_DATABASE && window.GAME_DATABASE.boons) {
                        const boonData = window.GAME_DATABASE.boons.find(b => b.name === boonName);
                        if (boonData) {
                            description = `
                                <strong>Reliable Property</strong><br><br>
                                <strong>Boon:</strong> ${boonName}<br>
                                <strong>Power Level:</strong> ${powerLevel}<br><br>
                                <strong>Property Description:</strong> ${window.GAME_DATABASE.weaponProperties.Reliable || 'No property description available'}<br><br>
                                <strong>Boon Description:</strong> ${boonData.generalDescription || 'No description available'}<br><br>
                                <strong>Effect:</strong> ${boonData.effectDescription || 'No effect description available'}<br><br>
                                <strong>Invocation Time:</strong> ${boonData.invocationTime || 'No invocation time specified'}<br><br>
                                <em>This boon is provided by equipment with the Reliable property. It is available for use but does not automatically activate.</em>
                            `;
                        } else {
                            description = `
                                <strong>Reliable Property</strong><br><br>
                                <strong>Boon:</strong> ${boonName}<br>
                                <strong>Power Level:</strong> ${powerLevel}<br><br>
                                <strong>Property Description:</strong> ${window.GAME_DATABASE.weaponProperties.Reliable || 'No property description available'}<br><br>
                                <em>This boon is provided by equipment with the Reliable property. It is available for use but does not automatically activate.</em>
                            `;
                        }
                    } else {
                        description = `
                            <strong>Reliable Property</strong><br><br>
                            <strong>Boon:</strong> ${boonName}<br>
                            <strong>Power Level:</strong> ${powerLevel}<br><br>
                            <strong>Property Description:</strong> ${window.GAME_DATABASE.weaponProperties.Reliable || 'No property description available'}<br><br>
                            <em>This boon is provided by equipment with the Reliable property. It is available for use but does not automatically activate.</em>
                        `;
                    }
                } else {
                    title = 'Reliable Property';
                    description = window.GAME_DATABASE.weaponProperties.Reliable || 'No description available for Reliable property.';
                }
            } else {
                // Handle other universal properties
                title = basePropertyName;
                // Try to get the property description from the database
                if (window.GAME_DATABASE && window.GAME_DATABASE.weaponProperties && window.GAME_DATABASE.weaponProperties[basePropertyName]) {
                    description = window.GAME_DATABASE.weaponProperties[basePropertyName];
                } else {
                    description = `The <strong>${basePropertyName}</strong> property is a universal equipment property that can be applied to weapons, armor, or items.`;
                }
            }
        }
        
        // If no description found, show a generic message
        if (!description) {
            title = propertyName;
            description = `No description available for "${propertyName}". This property may not be documented in the database yet.`;
            console.log('⚠️ No description found, showing generic message');
        }
        
        console.log('🔍 Final result:', { title, description });
        
        // Create and show the popup
        this.showPropertyModal(title, description);
    }

    // Show property modal
    showPropertyModal(title, description) {
        // Remove existing modal if present
        const existingModal = document.getElementById('propertyModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal HTML
        const modalHTML = `
            <div id="propertyModal" class="modal property-modal">
                <div class="modal-content property-modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <span class="close" onclick="window.app.closePropertyModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="property-description">${description}</div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        const modal = document.getElementById('propertyModal');
        modal.style.display = 'block';
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closePropertyModal();
            }
        });
    }

    // Close property modal
    closePropertyModal() {
        const modal = document.getElementById('propertyModal');
        if (modal) {
            modal.remove();
        }
    }

    // Generate unique equipment ID
    generateUniqueEquipmentId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `equipment_${timestamp}_${random}`;
    }

    // Populate available boons and banes based on character attributes
    populateAvailableBoonsAndBanes() {
        if (!this.currentCharacter || !window.GAME_DATABASE) return;
        
        this.populateAvailableBoons();
        this.populateAvailableBanes();
    }

    // Populate available boons
    populateAvailableBoons() {
        if (!this.currentCharacter || !window.GAME_DATABASE || !window.GAME_DATABASE.boons) return;
        
        const boonsList = document.getElementById('availableBoonsList');
        if (!boonsList) return;
        
        const availableBoons = this.getAvailableBoons();
        
        if (availableBoons.length === 0) {
            boonsList.innerHTML = '<div class="no-boons">No boons available with current attribute scores</div>';
            return;
        }
        
        boonsList.innerHTML = '';
        
        // Sort available boons alphabetically by name
        const sortedAvailableBoons = this.sortItemsAlphabetically(availableBoons);
        
        sortedAvailableBoons.forEach(boon => {
            const boonElement = this.createBoonElement(boon);
            boonsList.appendChild(boonElement);
        });
    }

    // Populate available banes
    populateAvailableBanes() {
        if (!this.currentCharacter || !window.GAME_DATABASE || !window.GAME_DATABASE.banes) return;
        
        const banesList = document.getElementById('availableBanesList');
        if (!banesList) return;
        
        const availableBanes = this.getAvailableBanes();
        
        if (availableBanes.length === 0) {
            banesList.innerHTML = '<div class="no-banes">No banes available with current attribute scores</div>';
            return;
        }
        
        banesList.innerHTML = '';
        
        // Sort available banes alphabetically by name
        const sortedAvailableBanes = this.sortItemsAlphabetically(availableBanes);
        
        sortedAvailableBanes.forEach(bane => {
            const baneElement = this.createBaneElement(bane);
            banesList.appendChild(baneElement);
        });
    }

    // Get available boons based on character attributes
    getAvailableBoons() {
        if (!this.currentCharacter || !window.GAME_DATABASE || !window.GAME_DATABASE.boons) return [];
        
        
        const availableBoons = [];
        
        // Combine official and custom boons
        const allBoons = [...window.GAME_DATABASE.boons];
        if (this.customBoons && this.customBoons.length > 0) {
            allBoons.push(...this.customBoons);
        }
        
        allBoons.forEach(boon => {
            // Track which attributes the character can actually use for this boon
            const usableAttributes = [];
            
            // Check if character has any of the required attributes at sufficient level
            const hasRequiredAttribute = boon.attributes.some(attributeName => {
                const attributeScore = this.getEffectiveAttributeScore(attributeName);
                
                // Check if any power level is accessible (including equipment bonuses)
                const hasAccessiblePowerLevel = boon.powerLevels.some(powerLevel => {
                    return attributeScore >= powerLevel;
                });
                
                if (hasAccessiblePowerLevel) {
                    usableAttributes.push(attributeName);
                }
                
                return hasAccessiblePowerLevel;
            });
            
            if (hasRequiredAttribute) {
                // Add the usable attributes to the boon object
                const boonWithUsableAttributes = {
                    ...boon,
                    usableAttributes: usableAttributes
                };
                availableBoons.push(boonWithUsableAttributes);
            }
        });
        
        
        // Also include persistent and reliable boons from equipment (these should always be available)
        if (this.currentCharacter.availableBoons && this.currentCharacter.availableBoons.length > 0) {
            const persistentBoons = this.currentCharacter.availableBoons.filter(boon => boon.isPersistent);
            const reliableBoons = this.currentCharacter.availableBoons.filter(boon => boon.isReliable);
            availableBoons.push(...persistentBoons, ...reliableBoons);
        }
        
        // Also include boons from Boon Access feats
        if (this.currentCharacter.feats) {
            const boonAccessFeats = this.currentCharacter.feats.filter(feat => feat.name === 'Boon Access' && feat.customDetails);
            boonAccessFeats.forEach(feat => {
                // Check both official and custom boons
                let selectedBoon = window.GAME_DATABASE.boons.find(boon => boon.name === feat.customDetails);
                if (!selectedBoon && this.customBoons) {
                    selectedBoon = this.customBoons.find(boon => boon.name === feat.customDetails);
                }
                if (selectedBoon) {
                    // Create a modified boon with the appropriate power level based on feat tier
                    const maxPowerLevel = Math.min(feat.tier, Math.max(...selectedBoon.powerLevels));
                    const accessiblePowerLevels = selectedBoon.powerLevels.filter(level => level <= maxPowerLevel);
                    
                    const boonWithAccess = {
                        ...selectedBoon,
                        powerLevels: accessiblePowerLevels,
                        usableAttributes: selectedBoon.attributes, // Boon Access allows using any of the boon's attributes
                        isBoonAccess: true // Mark this as a Boon Access boon
                    };
                    
                    // Check if this boon is already in the list (from normal attribute requirements)
                    const existingBoonIndex = availableBoons.findIndex(boon => boon.name === selectedBoon.name);
                    if (existingBoonIndex >= 0) {
                        // Replace with the Boon Access version (which may have different power levels)
                        availableBoons[existingBoonIndex] = boonWithAccess;
                    } else {
                        // Add the new Boon Access boon
                        availableBoons.push(boonWithAccess);
                    }
                }
            });
        }
        
        return availableBoons;
    }

    // Get available banes based on character attributes
    getAvailableBanes() {
        if (!this.currentCharacter || !window.GAME_DATABASE || !window.GAME_DATABASE.banes) return [];
        
        
        const availableBanes = [];
        
        // Combine official and custom banes
        const allBanes = [...window.GAME_DATABASE.banes];
        if (this.customBanes && this.customBanes.length > 0) {
            allBanes.push(...this.customBanes);
        }
        
        // Add database and custom banes based on character attributes
        allBanes.forEach(bane => {
            // Track which attributes the character can actually use for this bane
            const usableAttributes = [];
            
            // Check if character has any of the required attributes at sufficient level
            const hasRequiredAttribute = bane.attributes.some(attributeName => {
                const attributeScore = this.getEffectiveAttributeScore(attributeName);
                
                // Check if any power level is accessible (including equipment bonuses)
                const hasAccessiblePowerLevel = bane.powerLevels.some(powerLevel => {
                    return attributeScore >= powerLevel;
                });
                
                if (hasAccessiblePowerLevel) {
                    usableAttributes.push(attributeName);
                }
                
                return hasAccessiblePowerLevel;
            });
            
            if (hasRequiredAttribute) {
                // Add the usable attributes to the bane object
                const baneWithUsableAttributes = {
                    ...bane,
                    usableAttributes: usableAttributes
                };
                availableBanes.push(baneWithUsableAttributes);
            }
        });
        
        // Add weapon-based banes
        const weaponBanes = this.getWeaponBasedBanes();
        availableBanes.push(...weaponBanes);
        
        return availableBanes;
    }

    // Get weapon-based banes from equipped weapons
    getWeaponBasedBanes() {
        if (!this.currentCharacter || !this.currentCharacter.equipment) return [];
        
        const weaponBanes = [];
        
        // Check equipped weapons for banes
        this.currentCharacter.equipment.forEach(item => {
            if (item.type === 'weapon' && item.equipped && item.banes && item.banes.length > 0) {
                
                item.banes.forEach(baneName => {
                    if (baneName && baneName.trim() !== '') {
                        // Find the bane in database or custom banes
                        let foundBane = window.GAME_DATABASE.banes.find(b => b.name === baneName);
                        if (!foundBane && this.customBanes) {
                            foundBane = this.customBanes.find(b => b.name === baneName);
                        }
                        
                        if (foundBane) {
                            // Create a weapon-based bane object with unique ID
                            const weaponBane = {
                                ...foundBane,
                                id: `weapon_${item.id}_${baneName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                weaponSource: item.name,
                                isWeaponBased: true
                            };
                            
                            weaponBanes.push(weaponBane);
                        } else {
                            console.warn(`🔍 Bane not found in database or custom banes: ${baneName}`);
                        }
                    }
                });
            }
        });
        
        return weaponBanes;
    }

    // Increase attribute value
    increaseAttribute(attributeName) {
        if (!this.currentCharacter) return;
        
        const currentValue = this.currentCharacter.attributes[attributeName] || 0;
        const maxValue = this.getMaxAttributeValue();
        
        // In manual mode, skip max value check
        if (this.currentCharacter.manualSettings || currentValue < maxValue) {
            const newValue = currentValue + 1;
            
            // Update the display immediately for better UX
            const displayElement = document.getElementById(attributeName);
            const scoreElement = document.getElementById(`${attributeName}Score`);
            
            if (displayElement) {
                displayElement.textContent = newValue;
            }
            
            if (scoreElement) {
                scoreElement.textContent = newValue;
            }
            
            // Validate the increase (or skip validation in manual mode)
            this.validateAttributeChange({
                id: attributeName,
                value: newValue
            });
        }
    }

    // Decrease attribute value
    decreaseAttribute(attributeName) {
        if (!this.currentCharacter) return;
        
        const currentValue = this.currentCharacter.attributes[attributeName] || 0;
        if (currentValue > 0) { // Min attribute value is 0
            const newValue = currentValue - 1;
            
            // Update the display immediately for better UX
            const displayElement = document.getElementById(attributeName);
            const scoreElement = document.getElementById(`${attributeName}Score`);
            
            if (displayElement) {
                displayElement.textContent = newValue;
            }
            
            if (scoreElement) {
                scoreElement.textContent = newValue;
            }
            
            // Validate the decrease (or skip validation in manual mode)
            this.validateAttributeChange({
                id: attributeName,
                value: newValue
            });
        }
    }

    // Get attribute score for a given attribute name
    getAttributeScore(attributeName) {
        if (!this.currentCharacter) return 0;
        
        // Handle both capitalized and lowercase attribute names
        const normalizedName = attributeName.toLowerCase();
        
        // Check if the attribute exists in the character's attributes object
        const score = this.currentCharacter.attributes[normalizedName] || 0;
        return score;
    }


    // Update attribute display to show effective scores (including equipment bonuses)
    updateAttributeDisplay() {
        if (!this.currentCharacter) return;
        
        const attributes = [
            'agility', 'fortitude', 'might', 'learning', 'logic', 'perception', 'will',
            'deception', 'persuasion', 'presence', 'alteration', 'creation', 'energy',
            'entropy', 'influence', 'movement', 'prescience', 'protection'
        ];
        
        attributes.forEach(attributeName => {
            const scoreElement = document.getElementById(`${attributeName}Score`);
            if (scoreElement) {
                const baseScore = this.getAttributeScore(attributeName);
                const effectiveScore = this.getEffectiveAttributeScore(attributeName);
                
                // Update the display with effective score
                scoreElement.textContent = effectiveScore;
                
                // Add visual indication if score is boosted by equipment
                if (effectiveScore > baseScore) {
                    scoreElement.classList.add('boosted-by-equipment');
                    scoreElement.title = `Base: ${baseScore}, Boosted by equipment to: ${effectiveScore}`;
                } else {
                    scoreElement.classList.remove('boosted-by-equipment');
                    scoreElement.title = `Base score: ${baseScore}`;
                }
            }
        });
        
        // Update Well-Rounded feat description visibility
        this.updateWellRoundedDescription();
    }

    // Update Well-Rounded feat description visibility
    updateWellRoundedDescription() {
        if (!this.currentCharacter) return;
        
        const wellRoundedDescription = document.getElementById('wellRoundedDescription');
        if (!wellRoundedDescription) return;
        
        // Check if character has Well-Rounded feat
        const hasWellRounded = this.currentCharacter.feats && 
            this.currentCharacter.feats.some(feat => feat.name === 'Well-Rounded');
        
        // Show or hide the description based on feat presence
        if (hasWellRounded) {
            wellRoundedDescription.style.display = 'block';
        } else {
            wellRoundedDescription.style.display = 'none';
        }
    }

    // Setup view mode wealth controls event listeners
    setupViewModeWealthControls() {
        if (!this.currentCharacter) return;
        
        const viewWealthScoreInput = document.getElementById('viewWealthScore');
        const viewWealthUsedCheckbox = document.getElementById('viewWealthUsed');
        
        if (viewWealthScoreInput) {
            viewWealthScoreInput.addEventListener('change', () => {
                this.currentCharacter.wealthScore = parseInt(viewWealthScoreInput.value) || 0;
                this.updateWealthDisplay();
                this.autoSave();
            });
        }
        
        if (viewWealthUsedCheckbox) {
            viewWealthUsedCheckbox.addEventListener('change', () => {
                this.currentCharacter.wealthUsed = viewWealthUsedCheckbox.checked;
                this.autoSave();
            });
        }
    }

    // Helper function to check if character has feats that affect base actions
    hasFeatsAffectingBaseActions() {
        if (!this.currentCharacter || !this.currentCharacter.feats) return false;
        
        const baseActionFeats = [
            'Attack Redirection', 'Defensive Reflexes', 'Fast Draw', 'Great Leap', 
            'Heightened Invocation', 'Hospitaler', 'Multi-Attack Specialist', 
            'Reactionary Trance', 'Reckless Attack', 'Sentinel', 'Superior Concentration'
        ];
        
        return this.currentCharacter.feats.some(feat => baseActionFeats.includes(feat.name));
    }

    // Helper function to check if a feat can be taken multiple times
    canTakeFeatMultipleTimes(feat) {
        if (!feat) return false;
        
        // Check if feat has customInput (like Attack Specialization, Boon Access, etc.)
        if (feat.customInput) return true;
        
        // Check if specialText indicates multiple times with various patterns
        if (feat.specialText) {
            const specialText = feat.specialText.toLowerCase();
            
            // Pattern 1: "In addition to purchasing multiple tiers of this feat, you may take this feat multiple times"
            if (specialText.includes('in addition to purchasing multiple tiers of this feat, you may take this feat multiple times')) {
                return true;
            }
            
            // Pattern 2: "You may take this feat multiple times"
            if (specialText.includes('you may take this feat multiple times')) {
                return true;
            }
            
            // Pattern 3: "In addition to taking multiple tiers of this feat, you may take this feat multiple times"
            if (specialText.includes('in addition to taking multiple tiers of this feat, you may take this feat multiple times')) {
                return true;
            }
        }
        
        return false;
    }

    // Show Attribute Substitution dropdowns
    showAttributeSubstitutionDropdowns() {
        const customInputDiv = document.getElementById('featCustomInput');
        customInputDiv.style.display = 'block';
        
        // Create the dropdown interface
        customInputDiv.innerHTML = `
            <div class="attribute-substitution-controls">
                <div class="substitution-dropdown">
                    <label for="substitutionFromAttribute">Take Attribute Score from:</label>
                    <select id="substitutionFromAttribute" class="editable-only">
                        <option value="">Select source attribute...</option>
                        <option value="agility">Agility</option>
                        <option value="fortitude">Fortitude</option>
                        <option value="might">Might</option>
                        <option value="perception">Perception</option>
                        <option value="alteration">Alteration</option>
                        <option value="creation">Creation</option>
                        <option value="energy">Energy</option>
                        <option value="entropy">Entropy</option>
                        <option value="influence">Influence</option>
                        <option value="learning">Learning</option>
                        <option value="logic">Logic</option>
                        <option value="movement">Movement</option>
                        <option value="prescience">Prescience</option>
                        <option value="presence">Presence</option>
                        <option value="protection">Protection</option>
                        <option value="will">Will</option>
                    </select>
                </div>
                <div class="substitution-dropdown">
                    <label for="substitutionToAttribute">Apply Attribute Score to:</label>
                    <select id="substitutionToAttribute" class="editable-only">
                        <option value="">Select target attribute...</option>
                        <option value="agility">Agility</option>
                        <option value="fortitude">Fortitude</option>
                        <option value="might">Might</option>
                        <option value="perception">Perception</option>
                        <option value="alteration">Alteration</option>
                        <option value="creation">Creation</option>
                        <option value="energy">Energy</option>
                        <option value="entropy">Entropy</option>
                        <option value="influence">Influence</option>
                        <option value="learning">Learning</option>
                        <option value="logic">Logic</option>
                        <option value="movement">Movement</option>
                        <option value="prescience">Prescience</option>
                        <option value="presence">Presence</option>
                        <option value="protection">Protection</option>
                        <option value="will">Will</option>
                    </select>
                </div>
            </div>
        `;
    }

    // Show Bane Focus dropdown
    showBaneFocusDropdown() {
        const customInputDiv = document.getElementById('featCustomInput');
        customInputDiv.style.display = 'block';
        
        // Get available banes
        const availableBanes = this.getAvailableBanes();
        
        // Create the dropdown interface
        customInputDiv.innerHTML = `
            <div class="bane-focus-controls">
                <div class="bane-focus-dropdown">
                    <label for="baneFocusSelection">Choose Bane to Focus on:</label>
                    <select id="baneFocusSelection" class="editable-only">
                        <option value="">Select a bane...</option>
                        ${availableBanes.map(bane => `<option value="${bane.name}">${bane.name}</option>`).join('')}
                    </select>
                </div>
            </div>
        `;
    }

    // Show Battlefield Punisher dropdown
    showBattlefieldPunisherDropdown() {
        const customInputDiv = document.getElementById('featCustomInput');
        customInputDiv.style.display = 'block';
        
        // Get available banes
        const availableBanes = this.getAvailableBanes();
        
        // Create the dropdown interface
        customInputDiv.innerHTML = `
            <div class="battlefield-punisher-controls">
                <div class="battlefield-punisher-dropdown">
                    <label for="battlefieldPunisherSelection">Choose Bane to Punish with:</label>
                    <select id="battlefieldPunisherSelection" class="editable-only">
                        <option value="">Select a bane...</option>
                        ${availableBanes.map(bane => `<option value="${bane.name}">${bane.name}</option>`).join('')}
                    </select>
                </div>
            </div>
        `;
    }

    // Show Boon Access dropdown
    showBoonAccessDropdown() {
        const customInputDiv = document.getElementById('featCustomInput');
        customInputDiv.style.display = 'block';
        
        // Get all boons from the database (not just available ones, since Boon Access gives access to boons you don't have attributes for)
        const allBoons = window.GAME_DATABASE.boons || [];
        
        // Create the dropdown interface
        customInputDiv.innerHTML = `
            <div class="boon-access-controls">
                <div class="boon-access-dropdown">
                    <label for="boonAccessSelection">Choose Boon to Gain Access to:</label>
                    <select id="boonAccessSelection" class="editable-only">
                        <option value="">Select a boon...</option>
                        ${allBoons.map(boon => `<option value="${boon.name}">${boon.name} [${boon.powerLevels.join(',')}]</option>`).join('')}
                    </select>
                </div>
            </div>
        `;
    }

    // Show Boon Focus dropdown
    showBoonFocusDropdown() {
        const customInputDiv = document.getElementById('featCustomInput');
        customInputDiv.style.display = 'block';
        
        // Get available boons (only boons the character can actually invoke)
        const availableBoons = this.getAvailableBoons();
        
        // Create the dropdown interface
        customInputDiv.innerHTML = `
            <div class="boon-focus-controls">
                <div class="boon-focus-dropdown">
                    <label for="boonFocusSelection">Choose Boon to Focus on:</label>
                    <select id="boonFocusSelection" class="editable-only">
                        <option value="">Select a boon...</option>
                        ${availableBoons.map(boon => `<option value="${boon.name}">${boon.name} [${boon.powerLevels.join(',')}]</option>`).join('')}
                    </select>
                </div>
            </div>
        `;
    }

    // Show Extraordinary Focus dropdown
    showExtraordinaryFocusDropdown() {
        const customInputDiv = document.getElementById('featCustomInput');
        customInputDiv.style.display = 'block';
        
        // Get only extraordinary attributes (as per feat prerequisites)
        const extraordinaryAttributes = [
            { name: 'Alteration', value: 'alteration' },
            { name: 'Creation', value: 'creation' },
            { name: 'Energy', value: 'energy' },
            { name: 'Entropy', value: 'entropy' },
            { name: 'Influence', value: 'influence' },
            { name: 'Movement', value: 'movement' },
            { name: 'Prescience', value: 'prescience' },
            { name: 'Protection', value: 'protection' }
        ];
        
        // Create the dropdown interface
        customInputDiv.innerHTML = `
            <div class="extraordinary-focus-controls">
                <div class="extraordinary-focus-dropdown">
                    <label for="extraordinaryFocusSelection">Choose Extraordinary Attribute:</label>
                    <select id="extraordinaryFocusSelection" class="editable-only">
                        <option value="">Select an attribute...</option>
                        ${extraordinaryAttributes.map(attr => `<option value="${attr.value}">${attr.name}</option>`).join('')}
                    </select>
                </div>
            </div>
        `;
    }

    // Show Multi-Bane Specialist dropdown
    showMultiBaneSpecialistDropdown() {
        const customInputDiv = document.getElementById('featCustomInput');
        customInputDiv.style.display = 'block';
        
        // Get available banes for the dropdown
        const availableBanes = this.getAvailableBanes();
        
        // Create the dropdown interface
        customInputDiv.innerHTML = `
            <div class="multi-bane-specialist-controls">
                <div class="multi-bane-specialist-dropdown">
                    <label for="multiBaneSpecialistBane1">Choose First Bane:</label>
                    <select id="multiBaneSpecialistBane1" class="editable-only">
                        <option value="">Select first bane...</option>
                        ${availableBanes.map(bane => `<option value="${bane.name}">${bane.name}</option>`).join('')}
                    </select>
                </div>
                <div class="multi-bane-specialist-dropdown">
                    <label for="multiBaneSpecialistBane2">Choose Second Bane:</label>
                    <select id="multiBaneSpecialistBane2" class="editable-only">
                        <option value="">Select second bane...</option>
                        ${availableBanes.map(bane => `<option value="${bane.name}">${bane.name}</option>`).join('')}
                    </select>
                </div>
            </div>
        `;
    }

    // Show Potent Bane dropdown
    showPotentBaneDropdown() {
        const customInputDiv = document.getElementById('featCustomInput');
        customInputDiv.style.display = 'block';
        
        // Get available banes for the dropdown
        const availableBanes = this.getAvailableBanes();
        
        // Create the dropdown interface
        customInputDiv.innerHTML = `
            <div class="potent-bane-controls">
                <div class="potent-bane-dropdown">
                    <label for="potentBaneSelection">Choose Bane:</label>
                    <select id="potentBaneSelection" class="editable-only">
                        <option value="">Select a bane...</option>
                        ${availableBanes.map(bane => `<option value="${bane.name}">${bane.name}</option>`).join('')}
                    </select>
                </div>
            </div>
        `;
    }

    // Show Skill Specialization dropdown
    showSkillSpecializationDropdown() {
        const customInputDiv = document.getElementById('featCustomInput');
        customInputDiv.style.display = 'block';
        
        // Define all attributes (Physical, Mental, Social, Extraordinary)
        const allAttributes = [
            // Physical
            { name: 'Agility', value: 'agility' },
            { name: 'Fortitude', value: 'fortitude' },
            { name: 'Might', value: 'might' },
            { name: 'Perception', value: 'perception' },
            // Mental
            { name: 'Learning', value: 'learning' },
            { name: 'Logic', value: 'logic' },
            { name: 'Will', value: 'will' },
            // Social
            { name: 'Deception', value: 'deception' },
            { name: 'Persuasion', value: 'persuasion' },
            { name: 'Presence', value: 'presence' },
            // Extraordinary
            { name: 'Alteration', value: 'alteration' },
            { name: 'Creation', value: 'creation' },
            { name: 'Energy', value: 'energy' },
            { name: 'Entropy', value: 'entropy' },
            { name: 'Influence', value: 'influence' },
            { name: 'Movement', value: 'movement' },
            { name: 'Prescience', value: 'prescience' },
            { name: 'Protection', value: 'protection' }
        ];
        
        // Create the dropdown interface
        customInputDiv.innerHTML = `
            <div class="skill-specialization-controls">
                <div class="skill-specialization-dropdown">
                    <label for="skillSpecializationSelection">Choose Attribute:</label>
                    <select id="skillSpecializationSelection" class="editable-only">
                        <option value="">Select an attribute...</option>
                        ${allAttributes.map(attr => `<option value="${attr.value}">${attr.name}</option>`).join('')}
                    </select>
                </div>
            </div>
        `;
    }

    // Show custom input for Alternate Form feat
    showAlternateFormCustomInput() {
        const customInputDiv = document.getElementById('featCustomInput');
        customInputDiv.style.display = 'block';
        
        // Update label and placeholder for alternate form name
        const label = customInputDiv.querySelector('label');
        const textarea = document.getElementById('featCustomInputField');
        
        if (label) {
            label.textContent = 'Alternate Form Name:';
            label.style.color = '#dc3545'; // Red to indicate required
        }
        if (textarea) {
            textarea.placeholder = 'Enter the name for your alternate form character...';
        }
    }

    // Show custom input for Companion feat
    showCompanionCustomInput() {
        const customInputDiv = document.getElementById('featCustomInput');
        customInputDiv.style.display = 'block';
        
        // Update label and placeholder for companion name
        const label = customInputDiv.querySelector('label');
        const textarea = document.getElementById('featCustomInputField');
        
        if (label) {
            label.textContent = 'Companion Name:';
            label.style.color = '#dc3545'; // Red to indicate required
        }
        if (textarea) {
            textarea.placeholder = 'Enter the name for your companion character...';
        }
    }

    // Get effective attribute score considering Attribute Substitution and equipment boosts
    getEffectiveAttributeScore(attributeName) {
        if (!this.currentCharacter || !this.currentCharacter.attributes) {
            return 0;
        }
        
        // Get base attribute score
        let effectiveScore = this.currentCharacter.attributes[attributeName] || 0;
        
        // Check for Attribute Substitution feats
        const attributeSubstitutionFeats = this.currentCharacter.feats.filter(feat => 
            feat.name === 'Attribute Substitution' && feat.customDetails
        );
        
        attributeSubstitutionFeats.forEach(feat => {
            const [fromAttribute, toAttribute] = feat.customDetails.split('->');
            if (toAttribute === attributeName) {
                // This attribute is being substituted, use the source attribute's score
                effectiveScore = this.currentCharacter.attributes[fromAttribute] || 0;
            }
        });
        
        // Check for equipped items that boost this attribute
        const equippedItems = this.currentCharacter.equipment.filter(e => e.equipped && e.type === 'item' && e.itemAttributeScore && e.itemAttributeScore !== 'none');
        
        equippedItems.forEach(item => {
            if (item.itemAttributeScore.toLowerCase() === attributeName.toLowerCase() && item.itemPowerLevel) {
                // If item power level is higher than current score, use it
                if (item.itemPowerLevel > effectiveScore) {
                    effectiveScore = item.itemPowerLevel;
                }
            }
        });
        
        return effectiveScore;
    }

    // Update attribute displays to show substitutions
    updateAttributeSubstitutionDisplays() {
        if (!this.currentCharacter) return;
        
        // Check for Attribute Substitution feats
        const attributeSubstitutionFeats = this.currentCharacter.feats.filter(feat => 
            feat.name === 'Attribute Substitution' && feat.customDetails
        );
        
        // Reset all attribute colors
        const attributeElements = document.querySelectorAll('.attribute-score');
        attributeElements.forEach(element => {
            element.style.color = '';
        });
        
        // Apply substitution styling
        attributeSubstitutionFeats.forEach(feat => {
            const [fromAttribute, toAttribute] = feat.customDetails.split('->');
            const toAttributeElement = document.getElementById(`${toAttribute}Score`);
            const fromAttributeElement = document.getElementById(`${fromAttribute}Score`);
            
            if (toAttributeElement) {
                toAttributeElement.style.color = '#ff6b35'; // Orange color for substituted attributes
                toAttributeElement.title = `Substituted from ${fromAttribute} (${this.currentCharacter.attributes[fromAttribute]})`;
            }
            
            if (fromAttributeElement) {
                fromAttributeElement.style.color = '#4a90e2'; // Blue color for source attributes
                fromAttributeElement.title = `Source for ${toAttribute} substitution`;
            }
        });
    }

    // Create boon element for display
    createBoonElement(boon) {
        const boonElement = document.createElement('div');
        boonElement.className = 'boon-item';
        
        const availablePowerLevels = this.getAvailablePowerLevels(boon);
        const maxPowerLevel = availablePowerLevels.length > 0 ? Math.max(...availablePowerLevels) : 0;
        
        // Check if character has Extraordinary Healing feat and this is the Heal boon
        const hasExtraordinaryHealing = this.currentCharacter && this.currentCharacter.feats && 
            this.currentCharacter.feats.some(feat => feat.name === 'Extraordinary Healing');
        const isHealBoon = boon.name === 'Heal';
        
        // Check if character has Ferocious Minions feat and this is the Summon Creature boon
        const hasFerociousMinions = this.currentCharacter && this.currentCharacter.feats && 
            this.currentCharacter.feats.some(feat => feat.name === 'Ferocious Minions');
        const isSummonCreatureBoon = boon.name === 'Summon Creature';
        
        // Check if character has Hospitaler feat and this is the Restoration boon
        const hasHospitaler = this.currentCharacter && this.currentCharacter.feats && 
            this.currentCharacter.feats.some(feat => feat.name === 'Hospitaler');
        const isRestorationBoon = boon.name === 'Restoration';
        
        // Check if character has Mimic trait and this is the Shapeshift boon
        const hasMimic = this.currentCharacter && this.currentCharacter.feats && 
            this.currentCharacter.feats.some(feat => feat.name === 'Mimic');
        const isShapeshiftBoon = boon.name === 'Shapeshift';
        
        // Check if this boon is from Boon Access feat
        const isBoonAccess = boon.isBoonAccess || false;
        
        // Check if character has Boon Focus feat for this specific boon
        const hasBoonFocus = this.currentCharacter && this.currentCharacter.feats && 
            this.currentCharacter.feats.some(feat => feat.name === 'Boon Focus' && feat.customDetails === boon.name);
        
        // Create feat indicators
        let featIndicators = '';
        if (hasExtraordinaryHealing && isHealBoon) {
            featIndicators += '<span class="feat-indicator" title="Extraordinary Healing: Can take 1 hour instead of usual invocation time to heal lethal damage equal to total healing" onclick="window.app.showFeatPopup(\'Extraordinary Healing\', \'Can take 1 hour instead of usual invocation time to heal lethal damage equal to total healing\')">✨</span>';
        }
        if (hasFerociousMinions && isSummonCreatureBoon) {
            featIndicators += '<span class="feat-indicator" title="Ferocious Minions: Summoned creatures gain advantage 1 on all attack rolls to protect you or act in your favor for each tier of this feat" onclick="window.app.showFeatPopup(\'Ferocious Minions\', \'Summoned creatures gain advantage 1 on all attack rolls to protect you or act in your favor for each tier of this feat\')">🐉</span>';
        }
        if (hasHospitaler && isRestorationBoon) {
            featIndicators += '<span class="feat-indicator" title="Hospitaler: You gain advantage 1 any time you attempt to invoke the restoration boon" onclick="window.app.showFeatPopup(\'Hospitaler\', \'You gain advantage 1 any time you attempt to invoke the restoration boon\')">🏥</span>';
        }
        if (hasMimic && isShapeshiftBoon) {
            featIndicators += '<span class="feat-indicator" title="Mimic: When you use the shapeshift boon, you may take on the features of a specific creature" onclick="window.app.showFeatPopup(\'Mimic\', \'When you use the shapeshift boon, you may take on the features of a specific creature\')">🎭</span>';
        }
        if (isBoonAccess) {
            featIndicators += '<span class="feat-indicator" title="Boon Access: You can invoke this boon despite lacking the necessary attribute. For invocation rolls, treat your attribute score as the power level of the boon." onclick="window.app.showFeatPopup(\'Boon Access\', \'You can invoke this boon despite lacking the necessary attribute. For invocation rolls, treat your attribute score as the power level of the boon.\')">🔓</span>';
        }
        if (hasBoonFocus) {
            featIndicators += '<span class="feat-indicator" title="Boon Focus: You are specialized in the use of this particular boon. Gain automatic success on single-target invocations and advantage on multi-target invocations." onclick="window.app.showFeatPopup(\'Boon Focus\', \'You are specialized in the use of this particular boon. Gain automatic success on single-target invocations and advantage on multi-target invocations.\')">🎯</span>';
        }

        boonElement.innerHTML = `
            <div class="boon-header">
                <span class="boon-name">${boon.name}${featIndicators}</span>
                <span class="boon-attributes">(${boon.attributes.join(', ')})</span>
                <div class="power-levels">
                    ${availablePowerLevels.length > 0 ? availablePowerLevels.map(level => 
                        `<span class="power-level-badge ${level === maxPowerLevel ? 'active' : ''}">${level}</span>`
                    ).join('') : '<span class="power-level-badge">No PL</span>'}
                </div>
            </div>
            <div class="boon-details" style="display: none;">
                <div class="detail-section">
                    <h6>Invocation Time</h6>
                    <p>${boon.invocationTime || 'No invocation time specified'}</p>
                </div>
                <div class="detail-section">
                    <h6>Duration</h6>
                    <p>${boon.duration || 'No duration specified'}</p>
                </div>
                <div class="detail-section">
                    <h6>General Description</h6>
                    <p>${boon.generalDescription || 'No description available'}</p>
                </div>
                <div class="detail-section">
                    <h6>Effect Description</h6>
                    <p>${boon.effectDescription || 'No effect description available'}</p>
                </div>
                ${availablePowerLevels.length > 1 ? `
                    <div class="power-level-navigation">
                        <button class="power-level-nav-btn" onclick="window.app.previousPowerLevel('${boon.name}')" id="prev-${boon.name}">← Previous</button>
                        <span class="current-power-level">Power Level: <span id="current-level-${boon.name}">${maxPowerLevel}</span></span>
                        <button class="power-level-nav-btn" onclick="window.app.nextPowerLevel('${boon.name}')" id="next-${boon.name}" disabled>Next →</button>
                    </div>
                    <div class="detail-section">
                        <h6>Power Level <span id="current-level-display-${boon.name}">${maxPowerLevel}</span> Description</h6>
                        <p id="power-desc-${boon.name}">${this.getPowerLevelDescription(boon, maxPowerLevel)}</p>
                    </div>
                ` : `
                    <div class="detail-section">
                        <h6>Power Level ${maxPowerLevel} Description</h6>
                        <p>${this.getPowerLevelDescription(boon, maxPowerLevel)}</p>
                    </div>
                `}
                ${boon.specialText ? `
                    <div class="detail-section">
                        <h6>Special</h6>
                        <p>${boon.specialText}</p>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Add click event to expand/collapse boon details
        boonElement.addEventListener('click', (e) => {
            // Don't close if clicking on navigation buttons
            if (e.target.classList.contains('power-level-nav-btn') || e.target.closest('.power-level-navigation')) {
                return;
            }
            
            const detailsDiv = boonElement.querySelector('.boon-details');
            if (detailsDiv) {
                const isExpanded = detailsDiv.style.display === 'block';
                detailsDiv.style.display = isExpanded ? 'none' : 'block';
                boonElement.classList.toggle('expanded');
            }
        });
        
        return boonElement;
    }

    // Create bane element for display
    createBaneElement(bane) {
        const baneElement = document.createElement('div');
        baneElement.className = 'bane-item';
        
        const availablePowerLevels = this.getAvailablePowerLevels(bane);
        const maxPowerLevel = availablePowerLevels.length > 0 ? Math.max(...availablePowerLevels) : 0;
        
        // Check if character has Hallucination feat and this is the Phantasm bane
        const hasHallucination = this.currentCharacter && this.currentCharacter.feats && 
            this.currentCharacter.feats.some(feat => feat.name === 'Hallucination');
        const isPhantasmBane = bane.name === 'Phantasm';
        
        // Check if character has Silencing Strike feat and this is the Silenced bane
        const hasSilencingStrike = this.currentCharacter && this.currentCharacter.feats && 
            this.currentCharacter.feats.some(feat => feat.name === 'Silencing Strike');
        const isSilencedBane = bane.name === 'Silenced';
        
        // Check if character has Unending Charm feat and this is the Charm bane
        const hasUnendingCharm = this.currentCharacter && this.currentCharacter.feats && 
            this.currentCharacter.feats.some(feat => feat.name === 'Unending Charm');
        const isCharmBane = bane.name === 'Charm';
        
        // Check if character has Bane Focus feat for this specific bane
        const hasBaneFocus = this.currentCharacter && this.currentCharacter.feats && 
            this.currentCharacter.feats.some(feat => feat.name === 'Bane Focus' && feat.customDetails === bane.name);
        
        // Check if character has Battlefield Punisher feat for this specific bane
        const hasBattlefieldPunisher = this.currentCharacter && this.currentCharacter.feats && 
            this.currentCharacter.feats.some(feat => feat.name === 'Battlefield Punisher' && feat.customDetails === bane.name);
        
        // Check if character has Multi-Bane Specialist feat for this specific bane
        const hasMultiBaneSpecialist = this.currentCharacter && this.currentCharacter.feats && 
            this.currentCharacter.feats.some(feat => feat.name === 'Multi-Bane Specialist' && 
                feat.customDetails && (feat.customDetails.split('|')[0] === bane.name || feat.customDetails.split('|')[1] === bane.name));
        
        // Check if character has Potent Bane feat for this specific bane
        const hasPotentBane = this.currentCharacter && this.currentCharacter.feats && 
            this.currentCharacter.feats.some(feat => feat.name === 'Potent Bane' && feat.customDetails === bane.name);
        
        let featIndicator = '';
        if (hasHallucination && isPhantasmBane) {
            featIndicator += '<span class="feat-indicator" title="Hallucination: Can create hallucinations within a single target\'s mind instead of illusions perceptible to everyone" onclick="window.app.showFeatPopup(\'Hallucination\', \'Can create hallucinations within a single target\\\'s mind instead of illusions perceptible to everyone\')">🧠</span>';
        }
        if (hasSilencingStrike && isSilencedBane) {
            featIndicator += '<span class="feat-indicator" title="Silencing Strike: Whenever you deal damage using a weapon with the precise property to a target that is caught off guard, the target is afflicted with the silenced bane" onclick="window.app.showFeatPopup(\'Silencing Strike\', \'Whenever you deal damage using a weapon with the precise property to a target that is caught off guard, the target is afflicted with the silenced bane\')">🗡️</span>';
        }
        if (hasUnendingCharm && isCharmBane) {
            featIndicator += '<span class="feat-indicator" title="Unending Charm: When you invoke the charmed bane, targets who do not make their resist roll within 24 hours of being afflicted become permanently affected by the bane" onclick="window.app.showFeatPopup(\'Unending Charm\', \'When you invoke the charmed bane, targets who do not make their resist roll within 24 hours of being afflicted become permanently affected by the bane\')">💫</span>';
        }
        if (hasBaneFocus) {
            featIndicator += '<span class="feat-indicator" title="Bane Focus: When your roll on a damaging attack exceeds the target\'s defense by 5 or more, you can inflict this bane for free. Gain advantage 2 on bane attack rolls for this bane." onclick="window.app.showFeatPopup(\'Bane Focus\', \'When your roll on a damaging attack exceeds the target\\\'s defense by 5 or more, you can inflict this bane for free. Gain advantage 2 on bane attack rolls for this bane.\')">🎯</span>';
        }
        if (hasBattlefieldPunisher) {
            featIndicator += '<span class="feat-indicator" title="Battlefield Punisher: Choose a bane you can inflict. Any time you use the defend action with an attribute that could inflict the chosen bane and deal 10 damage via the Battlefield Retribution feat, you may choose to automatically afflict the attacker with the chosen bane." onclick="window.app.showFeatPopup(\'Battlefield Punisher\', \'Choose a bane you can inflict. Any time you use the defend action with an attribute that could inflict the chosen bane and deal 10 damage via the Battlefield Retribution feat, you may choose to automatically afflict the attacker with the chosen bane.\')">⚔️</span>';
        }
        if (hasMultiBaneSpecialist) {
            featIndicator += '<span class="feat-indicator" title="Multi-Bane Specialist: You can inflict this bane along with another bane in a single attack. The required attribute score is equal to the sum of both banes\' power levels." onclick="window.app.showFeatPopup(\'Multi-Bane Specialist\', \'You have mastered a signature attack that allows you to invoke two banes at once. Choose two banes that you are able to inflict and that share a common prerequisite attribute. You are able to inflict both banes with a single attack.\')">⚡</span>';
        }
        if (hasPotentBane) {
            featIndicator += '<span class="feat-indicator" title="Potent Bane: When a target makes a resist roll to shake off your invocation of this bane, they have disadvantage 1." onclick="window.app.showFeatPopup(\'Potent Bane\', \'You are so adept at a particular form of attack that your foes struggle to shake off the effects. Choose one bane that you can invoke that has a duration of resist ends. When a target makes a resist roll to shake off your invocation of the chosen bane, they have disadvantage 1.\')">💪</span>';
        }

        baneElement.innerHTML = `
            <div class="bane-header">
                <span class="bane-name">${bane.name}${featIndicator}</span>
                <span class="bane-attributes">(${bane.attributes.join(', ')})</span>
                <div class="power-levels">
                    ${availablePowerLevels.length > 0 ? availablePowerLevels.map(level => 
                        `<span class="power-level-badge ${level === maxPowerLevel ? 'active' : ''}">${level}</span>`
                    ).join('') : '<span class="power-level-badge">No PL</span>'}
                </div>
            </div>
            <div class="bane-details" style="display: none;">
                <div class="detail-section">
                    <h6>Invocation Time</h6>
                    <p>${bane.invocationTime || 'No invocation time specified'}</p>
                </div>
                <div class="detail-section">
                    <h6>Duration</h6>
                    <p>${bane.duration || 'No duration specified'}</p>
                </div>
                <div class="detail-section">
                    <h6>General Description</h6>
                    <p>${bane.generalDescription || 'No description available'}</p>
                </div>
                <div class="detail-section">
                    <h6>Effect Description</h6>
                    <p>${bane.effectDescription || 'No effect description available'}</p>
                </div>
                ${availablePowerLevels.length > 1 ? `
                    <div class="power-level-navigation">
                        <button class="power-level-nav-btn" onclick="window.app.previousPowerLevel('${bane.name}')" id="prev-${bane.name}">← Previous</button>
                        <span class="current-power-level">Power Level: <span id="current-level-${bane.name}">${maxPowerLevel}</span></span>
                        <button class="power-level-nav-btn" onclick="window.app.nextPowerLevel('${bane.name}')" id="next-${bane.name}" disabled>Next →</button>
                    </div>
                    <div class="detail-section">
                        <h6>Power Level <span id="current-level-display-${bane.name}">${maxPowerLevel}</span> Description</h6>
                        <p id="power-desc-${bane.name}">${this.getPowerLevelDescription(bane, maxPowerLevel)}</p>
                    </div>
                ` : `
                    <div class="detail-section">
                        <h6>Power Level ${maxPowerLevel} Description</h6>
                        <p>${this.getPowerLevelDescription(bane, maxPowerLevel)}</p>
                    </div>
                `}
                ${bane.specialText ? `
                    <div class="detail-section">
                        <h6>Special</h6>
                        <p>${bane.specialText}</p>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Add click event to expand/collapse bane details
        baneElement.addEventListener('click', (e) => {
            // Don't close if clicking on navigation buttons
            if (e.target.classList.contains('power-level-nav-btn') || e.target.closest('.power-level-navigation')) {
                return;
            }
            
            const detailsDiv = baneElement.querySelector('.bane-details');
            if (detailsDiv) {
                const isExpanded = detailsDiv.style.display === 'block';
                detailsDiv.style.display = isExpanded ? 'none' : 'block';
                baneElement.classList.toggle('expanded');
            }
        });
        
        return baneElement;
    }

    // Get available power levels for a boon or bane
    getAvailablePowerLevels(boonOrBane) {
        if (!this.currentCharacter) return [];
        
        
        // Handle persistent boons from equipment (they have a specific power level)
        if (boonOrBane.isPersistent && boonOrBane.powerLevel) {
            return [boonOrBane.powerLevel];
        }
        
        // Handle reliable boons from equipment (they have a specific power level)
        if (boonOrBane.isReliable && boonOrBane.powerLevel) {
            return [boonOrBane.powerLevel];
        }
        
        // Handle Boon Access boons (they have pre-filtered power levels)
        if (boonOrBane.isBoonAccess && boonOrBane.powerLevels) {
            return boonOrBane.powerLevels;
        }
        
        // Handle regular boons/banes from database
        if (!boonOrBane.powerLevels || !boonOrBane.attributes) {
            return [];
        }
        
        
        const availableLevels = [];
        
        // Check each power level against the character's attribute scores
        boonOrBane.powerLevels.forEach(powerLevel => {
            // Check if character has any attribute at sufficient level for this power level
            const hasRequiredAttribute = boonOrBane.attributes.some(attributeName => {
                const attributeScore = this.getEffectiveAttributeScore(attributeName);
                const isAccessible = attributeScore >= powerLevel;
                return isAccessible;
            });
            
            if (hasRequiredAttribute) {
                availableLevels.push(powerLevel);
            } else {
            }
        });
        
        return availableLevels;
    }

    // Get power level description
    getPowerLevelDescription(boonOrBane, powerLevel) {
        // Handle persistent boons from equipment
        if (boonOrBane.isPersistent) {
            // Try to get the specific power level description first
            if (boonOrBane.powerLevelDescriptions && boonOrBane.powerLevelDescriptions[powerLevel]) {
                return boonOrBane.powerLevelDescriptions[powerLevel].description || boonOrBane.effectDescription || 'Persistent boon from equipment';
            }
            // Fall back to effect description
            return boonOrBane.effectDescription || 'Persistent boon from equipment';
        }
        
        // Handle reliable boons from equipment
        if (boonOrBane.isReliable) {
            // Try to get the specific power level description first
            if (boonOrBane.powerLevelDescriptions && boonOrBane.powerLevelDescriptions[powerLevel]) {
                return boonOrBane.powerLevelDescriptions[powerLevel].description || boonOrBane.effectDescription || 'Reliable boon from equipment';
            }
            // Fall back to effect description
            return boonOrBane.effectDescription || 'Reliable boon from equipment';
        }
        
        if (boonOrBane.powerLevelDescriptions && boonOrBane.powerLevelDescriptions[powerLevel]) {
            return boonOrBane.powerLevelDescriptions[powerLevel].description || 'No description available for this power level';
        }
        // For single-power-level boons/banes, use the effect description
        if (boonOrBane.powerLevels && boonOrBane.powerLevels.length === 1) {
            return boonOrBane.effectDescription || 'No description available for this power level';
        }
        return 'No description available for this power level';
    }



    // Navigate to previous power level
    previousPowerLevel(boonOrBaneName) {
        const currentLevelSpan = document.getElementById(`current-level-${boonOrBaneName}`);
        const powerDescElement = document.getElementById(`power-desc-${boonOrBaneName}`);
        const currentLevelDisplay = document.getElementById(`current-level-display-${boonOrBaneName}`);
        const prevBtn = document.getElementById(`prev-${boonOrBaneName}`);
        const nextBtn = document.getElementById(`next-${boonOrBaneName}`);
        
        if (!currentLevelSpan || !powerDescElement) return;
        
        let currentLevel = parseInt(currentLevelSpan.textContent);
        const boonOrBane = this.getBoonOrBaneByName(boonOrBaneName);
        
        if (!boonOrBane) return;
        
        const availableLevels = this.getAvailablePowerLevels(boonOrBane);
        
        const currentIndex = availableLevels.indexOf(currentLevel);
        if (currentIndex > 0) {
            const newLevel = availableLevels[currentIndex - 1];
            
            // Update all level displays
            currentLevelSpan.textContent = newLevel;
            if (currentLevelDisplay) {
                currentLevelDisplay.textContent = newLevel;
            }
            
            // Update description
            powerDescElement.textContent = this.getPowerLevelDescription(boonOrBane, newLevel);
            
            // Update button states
            if (prevBtn) prevBtn.disabled = currentIndex - 1 === 0;
            if (nextBtn) nextBtn.disabled = false;
        }
    }

    // Navigate to next power level
    nextPowerLevel(boonOrBaneName) {
        const currentLevelSpan = document.getElementById(`current-level-${boonOrBaneName}`);
        const powerDescElement = document.getElementById(`power-desc-${boonOrBaneName}`);
        const currentLevelDisplay = document.getElementById(`current-level-display-${boonOrBaneName}`);
        const prevBtn = document.getElementById(`prev-${boonOrBaneName}`);
        const nextBtn = document.getElementById(`next-${boonOrBaneName}`);
        
        if (!currentLevelSpan || !powerDescElement) return;
        
        let currentLevel = parseInt(currentLevelSpan.textContent);
        const boonOrBane = this.getBoonOrBaneByName(boonOrBaneName);
        
        if (!boonOrBane) return;
        
        const availableLevels = this.getAvailablePowerLevels(boonOrBane);
        
        const currentIndex = availableLevels.indexOf(currentLevel);
        if (currentIndex < availableLevels.length - 1) {
            const newLevel = availableLevels[currentIndex + 1];
            
            // Update all level displays
            currentLevelSpan.textContent = newLevel;
            if (currentLevelDisplay) {
                currentLevelDisplay.textContent = newLevel;
            }
            
            // Update description
            powerDescElement.textContent = this.getPowerLevelDescription(boonOrBane, newLevel);
            
            // Update button states
            if (nextBtn) nextBtn.disabled = currentIndex + 1 === availableLevels.length - 1;
            if (prevBtn) prevBtn.disabled = false;
        }
    }

    // Get boon or bane by name from database
    getBoonOrBaneByName(name) {
        // First check character's available boons (includes Boon Access boons)
        if (this.currentCharacter) {
            const availableBoons = this.getAvailableBoons();
            const availableBoon = availableBoons.find(b => b.name === name);
            if (availableBoon) return availableBoon;
            
            const availableBanes = this.getAvailableBanes();
            const availableBane = availableBanes.find(b => b.name === name);
            if (availableBane) return availableBane;
        }
        
        // Fallback to database boons
        const databaseBoon = window.GAME_DATABASE.boons.find(b => b.name === name);
        if (databaseBoon) return databaseBoon;
        
        // Fallback to database banes
        const databaseBane = window.GAME_DATABASE.banes.find(b => b.name === name);
        if (databaseBane) return databaseBane;
        
        return null;
    }

    // Find boon or bane by name or unique ID
    findBoonOrBane(name) {
        // First check if this is a persistent boon from equipment
        if (this.currentCharacter && this.currentCharacter.availableBoons) {
            const persistentBoon = this.currentCharacter.availableBoons.find(b => b.id === name && b.isPersistent);
            if (persistentBoon) return persistentBoon;
        }
        
        // Check if this is a reliable boon from equipment
        if (this.currentCharacter && this.currentCharacter.availableBoons) {
            const reliableBoon = this.currentCharacter.availableBoons.find(b => b.id === name && b.isReliable);
            if (reliableBoon) return reliableBoon;
        }
        
        // Check if this is a cursed bane from equipment
        if (this.currentCharacter && this.currentCharacter.banes) {
            const cursedBane = this.currentCharacter.banes.find(b => b.id === name && b.isCursed);
            if (cursedBane) return cursedBane;
        }
        
        // Check if this is a weapon-based bane (they're in available banes)
        if (this.currentCharacter && this.currentCharacter.availableBanes) {
            const weaponBane = this.currentCharacter.availableBanes.find(b => b.id === name && b.isWeaponBased);
            if (weaponBane) return weaponBane;
        }
        
        // Then check the database by name
        if (window.GAME_DATABASE) {
            const boon = window.GAME_DATABASE.boons?.find(b => b.name === name);
            if (boon) return boon;
            
            const bane = window.GAME_DATABASE.banes?.find(b => b.name === name);
            if (bane) return bane;
        }
        return null;
    }

    // Update active power level badge
    updateActivePowerLevelBadge(element, activeLevel) {
        const badges = element.querySelectorAll('.power-level-badge');
        badges.forEach(badge => {
            if (parseInt(badge.textContent) === activeLevel) {
                badge.classList.add('active');
            } else {
                badge.classList.remove('active');
            }
        });
    }

    // Migrate character attributes to new structure
    migrateCharacterAttributes() {
        if (!this.currentCharacter) return;
        
        const expectedAttributes = ['agility', 'fortitude', 'might', 'learning', 'logic', 'perception', 'will', 'deception', 'persuasion', 'presence', 'alteration', 'creation', 'energy', 'entropy', 'influence', 'movement', 'prescience', 'protection'];
        
        // Check if we need to migrate
        const needsMigration = expectedAttributes.some(attr => this.currentCharacter.attributes[attr] === undefined);
        
        if (needsMigration) {
            console.log('Migrating character attributes from old structure...');
            
            // Create new attributes object with default values
            const newAttributes = {};
            expectedAttributes.forEach(attr => {
                newAttributes[attr] = 0;
            });
            
            // Map old attributes to new ones
            const attributeMapping = {
                'intellect': 'learning', // Map old intellect to learning
                // Add other mappings as needed
            };
            
            // Copy existing attributes, mapping old names to new ones
            Object.keys(this.currentCharacter.attributes).forEach(oldAttr => {
                const newAttr = attributeMapping[oldAttr] || oldAttr;
                if (expectedAttributes.includes(newAttr)) {
                    newAttributes[newAttr] = this.currentCharacter.attributes[oldAttr];
                }
            });
            
            // Update the character object
            this.currentCharacter.attributes = newAttributes;
            console.log('Migration complete. New attributes:', this.currentCharacter.attributes);
            
            // Save the migrated character
            this.autoSave();
        }
    }

    // Base Actions Methods
    populateBaseActions() {
        const actionsList = document.getElementById('actionsList');
        if (!actionsList) {
            console.log('Actions list element not found');
            return;
        }

        console.log('GAME_DATABASE status:', {
            exists: !!window.GAME_DATABASE,
            type: typeof window.GAME_DATABASE,
            keys: window.GAME_DATABASE ? Object.keys(window.GAME_DATABASE) : 'N/A',
            fullObject: window.GAME_DATABASE
        });

        // Check if database is available
        if (!window.GAME_DATABASE) {
            console.log('GAME_DATABASE not available yet, retrying in 500ms...');
            setTimeout(() => this.populateBaseActions(), 500);
            return;
        }
        
        // Additional check for baseactions property
        if (!window.GAME_DATABASE.baseactions) {
            console.log('GAME_DATABASE exists but baseactions not found, retrying in 500ms...');
            console.log('Available properties:', Object.keys(window.GAME_DATABASE));
            
            // Try to access the database directly
            if (window.GAME_DATABASE && Array.isArray(window.GAME_DATABASE.baseactions)) {
                console.log('Found baseactions array directly:', window.GAME_DATABASE.baseactions.length);
            } else {
                console.log('baseactions is not an array or undefined');
                
                // Try to force reload the database
                this.reloadDatabase();
            }
            
            setTimeout(() => this.populateBaseActions(), 500);
            return;
        }

        // Get all base actions from the database
        const baseActions = window.GAME_DATABASE?.baseactions || [];
        console.log('Base actions found:', baseActions.length, baseActions);
        
        if (baseActions.length === 0) {
            console.log('No base actions available in database');
            console.log('Available database keys:', Object.keys(window.GAME_DATABASE));
            actionsList.innerHTML = '<p class="text-secondary">No base actions available.</p>';
            return;
        }

        // Populate the actions list
        this.displayBaseActions(baseActions);
    }
    
    reloadDatabase() {
        console.log('Attempting to reload database...');
        
        // Try to access the database from different possible locations
        if (typeof GAME_DATABASE !== 'undefined') {
            console.log('Found GAME_DATABASE in global scope:', GAME_DATABASE);
            window.GAME_DATABASE = GAME_DATABASE;
        }
        
        // Check if the database is defined in the current scope
        if (typeof window.GAME_DATABASE === 'undefined') {
            console.log('GAME_DATABASE not found in window scope');
        }
    }

    displayBaseActions(actions) {
        const actionsList = document.getElementById('actionsList');
        if (!actionsList) {
            console.log('Actions list element not found in displayBaseActions');
            return;
        }

        console.log('Displaying actions:', actions.length, actions);
        actionsList.innerHTML = '';

        // Sort actions by duration priority
        const sortedActions = this.sortActionsByDuration(actions);
        
        // Filter actions based on character feats
        const filteredActions = sortedActions.filter(action => {
            // Show Hospitaler Aid only if character has Hospitaler feat
            if (action.baseActionName === 'Hospitaler Aid') {
                return this.hasFeat('Hospitaler');
            }
            // Show Reactionary Trance only if character has Reactionary Trance feat
            if (action.baseActionName === 'Reactionary Trance') {
                return this.hasFeat('Reactionary Trance');
            }
            // Show Reckless Attack only if character has Reckless Attack feat
            if (action.baseActionName === 'Reckless Attack') {
                return this.hasFeat('Reckless Attack');
            }
            // Show all other actions
            return true;
        });
        
        // Group actions by duration
        const actionsByDuration = {};
        filteredActions.forEach(action => {
            if (!actionsByDuration[action.actionDuration]) {
                actionsByDuration[action.actionDuration] = [];
            }
            actionsByDuration[action.actionDuration].push(action);
        });

        // Create sections for each duration type in the specified order
        const durationOrder = ['Focus Action', 'Major Action', 'Movement Action', 'Minor Action', 'Interrupt Action', 'Special Action', 'Free Action', 'Detailed Explanation'];
        
        // Define category descriptions
        const categoryDescriptions = {
            'Focus Action': 'You focus your turn on only one action',
            'Major Action': 'Once per Round on your Turn',
            'Movement Action': 'Once per round on your Turn',
            'Minor Action': 'Each one may be used once per round',
            'Interrupt Action': 'You lose your major action for your next turn in the initiative but use this during someone else\'s turn instead',
            'Special Action': 'These have some extra rules/timing to them',
            'Free Action': 'Can be used at any time without consuming your turn',
            'Detailed Explanation': 'These explain some actions or rules in further detail'
        };
        
        durationOrder.forEach(duration => {
            if (actionsByDuration[duration] && actionsByDuration[duration].length > 0) {
                const durationSection = document.createElement('div');
                durationSection.className = 'duration-section';
                
                const durationClass = duration.toLowerCase().replace(/\s+/g, '-');
                const categoryDescription = categoryDescriptions[duration] || '';
                
                durationSection.innerHTML = `
                    <div class="duration-header" onclick="window.app.toggleDurationSection('${durationClass}')">
                        <h4 class="duration-title">
                            <i class="fas fa-chevron-right duration-icon" id="icon-${durationClass}"></i>
                            ${duration} (${actionsByDuration[duration].length})
                        </h4>
                        ${categoryDescription ? `<p class="category-description">${categoryDescription}</p>` : ''}
                    </div>
                    <div class="duration-content" id="content-${durationClass}" style="display: none;">
                        ${actionsByDuration[duration].map(action => {
                            let featNotes = '';
                            
                            // Add feat notes for specific actions
                            if (action.baseActionName === 'Defend') {
                                const featNotesArray = [];
                                
                                // Check for Attack Redirection feat
                                if (this.hasFeat('Attack Redirection')) {
                                    const tier = this.getFeatTier('Attack Redirection');
                                    const cumulativeDescription = this.getCumulativeFeatDescription('Attack Redirection', tier, false);
                                    if (cumulativeDescription) {
                                        featNotesArray.push(`<div class="feat-note"><strong>Attack Redirection T${tier}:</strong><br>${cumulativeDescription}</div>`);
                                    }
                                }
                                
                                // Check for Defensive Reflexes feat
                                if (this.hasFeat('Defensive Reflexes')) {
                                    const tier = this.getFeatTier('Defensive Reflexes');
                                    const cumulativeDescription = this.getCumulativeFeatDescription('Defensive Reflexes', tier, false);
                                    if (cumulativeDescription) {
                                        featNotesArray.push(`<div class="feat-note"><strong>Defensive Reflexes T${tier}:</strong><br>${cumulativeDescription}</div>`);
                                    }
                                }
                                
                                // Check for Sentinel feat
                                if (this.hasFeat('Sentinel')) {
                                    const tier = this.getFeatTier('Sentinel');
                                    featNotesArray.push(`<div class="feat-note"><strong>Sentinel T${tier}:</strong><br>Once per round, after you have expended your next major action to perform a defend action, you get ${tier} additional major action${tier > 1 ? 's' : ''} that must be spent before the start of your next turn to make another defend action.</div>`);
                                }
                                
                                if (featNotesArray.length > 0) {
                                    featNotes = `<div class="feat-notes-section">${featNotesArray.join('')}</div>`;
                                }
                            }
                            
                            // Add feat notes for Draw Weapon action
                            if (action.baseActionName === 'Draw Weapon') {
                                const featNotesArray = [];
                                
                                // Check for Fast Draw feat
                                if (this.hasFeat('Fast Draw')) {
                                    const tier = this.getFeatTier('Fast Draw');
                                    const cumulativeDescription = this.getCumulativeFeatDescription('Fast Draw', tier, false);
                                    if (cumulativeDescription) {
                                        featNotesArray.push(`<div class="feat-note"><strong>Fast Draw T${tier}:</strong><br>${cumulativeDescription}</div>`);
                                    }
                                }
                                
                                if (featNotesArray.length > 0) {
                                    featNotes = `<div class="feat-notes-section">${featNotesArray.join('')}</div>`;
                                }
                            }
                            
                            // Add feat notes for Jump action
                            if (action.baseActionName === 'Jump') {
                                const featNotesArray = [];
                                
                                // Check for Great Leap feat
                                if (this.hasFeat('Great Leap')) {
                                    const tier = this.getFeatTier('Great Leap');
                                    const cumulativeDescription = this.getCumulativeFeatDescription('Great Leap', tier, false);
                                    if (cumulativeDescription) {
                                        featNotesArray.push(`<div class="feat-note"><strong>Great Leap T${tier}:</strong><br>${cumulativeDescription}</div>`);
                                    }
                                }
                                
                                if (featNotesArray.length > 0) {
                                    featNotes = `<div class="feat-notes-section">${featNotesArray.join('')}</div>`;
                                }
                            }
                            
                            // Add feat notes for Invoke a Boon action
                            if (action.baseActionName === 'Invoke a Boon') {
                                const featNotesArray = [];
                                
                                // Check for Heightened Invocation feat
                                if (this.hasFeat('Heightened Invocation')) {
                                    const tier = this.getFeatTier('Heightened Invocation');
                                    const cumulativeDescription = this.getCumulativeFeatDescription('Heightened Invocation', tier, false);
                                    if (cumulativeDescription) {
                                        featNotesArray.push(`<div class="feat-note"><strong>Heightened Invocation T${tier}:</strong><br>${cumulativeDescription}</div>`);
                                    }
                                }
                                
                                if (featNotesArray.length > 0) {
                                    featNotes = `<div class="feat-notes-section">${featNotesArray.join('')}</div>`;
                                }
                            }
                            
                            // Add feat notes for Damaging Attack action
                            if (action.baseActionName === 'Damaging Attack') {
                                const featNotesArray = [];
                                
                                // Check for Multi-Attack Specialist feat
                                if (this.hasFeat('Multi-Attack Specialist')) {
                                    const tier = this.getFeatTier('Multi-Attack Specialist');
                                    featNotesArray.push(`<div class="feat-note"><strong>Multi-Attack Specialist T${tier}:</strong><br>You may declare multi-attacks at the start of your turn, gaining additional major actions for attacks. Each additional attack increases disadvantage by 3, reduced by 1 per feat tier.</div>`);
                                }
                                
                                if (featNotesArray.length > 0) {
                                    featNotes = `<div class="feat-notes-section">${featNotesArray.join('')}</div>`;
                                }
                            }
                            
                            // Add feat notes for Sustain a boon action
                            if (action.baseActionName === 'Sustain a boon') {
                                const featNotesArray = [];
                                
                                // Check for Superior Concentration feat
                                if (this.hasFeat('Superior Concentration')) {
                                    const tier = this.getFeatTier('Superior Concentration');
                                    featNotesArray.push(`<div class="feat-note"><strong>Superior Concentration T${tier}:</strong><br>When you take the sustain a boon minor action, you may sustain ${tier} additional boon${tier > 1 ? 's' : ''}.</div>`);
                                }
                                
                                if (featNotesArray.length > 0) {
                                    featNotes = `<div class="feat-notes-section">${featNotesArray.join('')}</div>`;
                                }
                            }
                            
                            // Add feat notes for Multi-targeting action
                            if (action.baseActionName === 'Multi-targeting') {
                                const featNotesArray = [];
                                
                                // Check for Multi-Target Attack Specialist feat
                                if (this.hasFeat('Multi-Target Attack Specialist')) {
                                    const tier = this.getFeatTier('Multi-Target Attack Specialist');
                                    featNotesArray.push(`<div class="feat-note"><strong>Multi-Target Attack Specialist T${tier}:</strong><br>For your chosen attack type (area, ranged, or melee), you reduce the disadvantage penalty associated with multi-targeting by ${tier} per tier of this feat.</div>`);
                                }
                                
                                if (featNotesArray.length > 0) {
                                    featNotes = `<div class="feat-notes-section">${featNotesArray.join('')}</div>`;
                                }
                            }
                            
                            return `
                                <div class="action-card">
                                    <div class="action-header">
                                        <h4 class="action-name">${action.baseActionName}</h4>
                                        <span class="action-duration-badge ${durationClass}">${action.actionDuration}</span>
                                    </div>
                                    <p class="action-description">${action.description}</p>
                                    ${featNotes}
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
                
                actionsList.appendChild(durationSection);
            }
        });
        
        console.log('Actions displayed successfully in duration sections');
    }

    // Toggle duration section expand/collapse
    toggleDurationSection(durationClass) {
        const content = document.getElementById(`content-${durationClass}`);
        const icon = document.getElementById(`icon-${durationClass}`);
        
        if (content && icon) {
            if (content.style.display === 'none') {
                // Expand section
                content.style.display = 'block';
                icon.className = 'fas fa-chevron-down duration-icon';
            } else {
                // Collapse section
                content.style.display = 'none';
                icon.className = 'fas fa-chevron-right duration-icon';
            }
        }
    }

    // Sort actions by duration priority
    sortActionsByDuration(actions) {
        // Define duration priority order as requested by user
        const durationPriority = {
            'Focus Action': 1,
            'Major Action': 2,
            'Movement Action': 3,
            'Minor Action': 4,
            'Special Action': 6,
            'Interrupt Action': 5,
            'Detailed Explanation': 7
        };

        return actions.sort((a, b) => {
            const priorityA = durationPriority[a.actionDuration] || 999;
            const priorityB = durationPriority[b.actionDuration] || 999;
            return priorityA - priorityB;
        });
    }



}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    // Add a small delay to ensure all elements are fully loaded
    setTimeout(() => {
        try {
            window.app = new CharacterSheetApp();
            console.log('App instance created:', window.app);
            
            // Now check required elements after app is created
            window.app.checkRequiredElements();
            
        } catch (error) {
            console.error('Failed to create app instance:', error);
            // Show error to user
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #ff6b6b;
                color: white;
                padding: 20px;
                border-radius: 8px;
                z-index: 10000;
                font-weight: bold;
                max-width: 80%;
                text-align: center;
            `;
            errorDiv.innerHTML = `
                <h3>Application Error</h3>
                <p>${error.message}</p>
                <p>Please refresh the page and try again.</p>
            `;
            document.body.appendChild(errorDiv);
        }
    }, 100);
});

// Only initialize once on DOMContentLoaded
// Removed duplicate initialization on window.load to prevent duplicate event listeners



