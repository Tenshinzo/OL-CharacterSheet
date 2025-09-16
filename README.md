# Open Legend Character Sheet Application

A comprehensive web-based character sheet application for the Open Legend RPG system, featuring an intuitive interface for managing character stats, equipment, abilities, and more.

## Features

### Core Character Management
- **Character Creation**: Create new characters with customizable names, descriptions, and backgrounds
- **Character Storage**: All character data is automatically saved to local storage
- **Character Duplication**: Easily duplicate existing characters for variations
- **Import/Export**: Import and export character data in JSON format
- **Character Deletion**: Remove characters from the main overview page

### Attribute System
- **18 Attributes**: Complete coverage of all Open Legend attributes
- **Dynamic Point Calculation**: Automatic calculation of attribute costs using cumulative formula
- **Level-Based Limits**: Attribute maximums automatically adjust based on character level
- **Point Validation**: Prevents increasing attributes when insufficient points are available
- **Visual Feedback**: Clear display of points spent vs. available points

### Health & Damage System
- **Dynamic Health Bar**: Visual representation of current HP, missing HP, and reduced max HP
- **Touch-Friendly Inputs**: Large, easy-to-use number inputs for damage/healing values
- **Dedicated Buttons**: Separate buttons for damage, healing, lethal damage, and lethal healing
- **Lethal Damage**: Reduces maximum HP (displayed in black on health bar)
- **Automatic Updates**: Health bar and displays update in real-time

### Combat & Defense
- **Three Defense Types**: Guard (Agility + Might), Toughness (Fortitude + Will), Resolve (Presence + Will)
- **Attack Test Calculator**: Input attack rolls to see if they hit your defenses
- **Equipment Bonuses**: Armor and equipment can provide defense bonuses
- **Dynamic Calculations**: All defense values update automatically with attribute changes

### Equipment System
- **Dual-Wielding**: Equip up to 2 weapons simultaneously
- **Equipment Types**: Support for weapons, armor, and general equipment
- **Armor Requirements**: Fortitude requirements for heavy armor
- **Special Effects**: Text fields for equipment bonuses and special abilities

### Advantages & Disadvantages
- **Attribute Filtering**: Filter by specific attributes or "All Attributes"
- **Smart Filtering**: Items with "All Attributes" always show regardless of filter
- **Dynamic Lists**: Add, remove, and manage character advantages/disadvantages

### Boons & Banes
- **Active Boons**: Track currently active boons with power levels and durations
- **Sustain Tracking**: Checkbox for boons with "sustain" duration
- **Active Banes**: Track inflicted banes with resistance tracking
- **Dynamic Checkboxes**: Resistance checkboxes appear after adding banes

### Feats, Perks & Flaws
- **Character Traits**: Add custom perks and flaws with descriptions
- **Feat Management**: Track character feats and their effects
- **Custom Descriptions**: Full text fields for all trait descriptions

### Game Database
- **Official Content**: Pre-populated with official Open Legend content
- **Easy Editing**: All data stored in easily editable JavaScript objects
- **Comprehensive Coverage**: Includes Boons, Banes, Feats, Perks, and Flaws
- **Power Level Support**: Detailed descriptions for each power level
- **Attribute Requirements**: Clear prerequisites and requirements

## Technical Details

### File Structure
- `index.html` - Main application structure and UI
- `script.js` - Core application logic and functionality
- `styles.css` - Visual styling and animations
- `gameDatabase.js` - Game content database
- `run_server.ps1` - PowerShell script to start the server
- `run_server.bat` - Batch script to start the server

### Technology Stack
- **Frontend**: Pure HTML5, CSS3, and JavaScript (ES6+)
- **Storage**: Browser Local Storage for data persistence
- **Server**: Python HTTP server for local development
- **No Dependencies**: Lightweight, no external libraries required

### Browser Compatibility
- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile-friendly responsive design

## Getting Started

### Prerequisites
- Python 3.6+ installed on your system
- Modern web browser

### Installation & Setup
1. **Download/Clone** the application files
2. **Navigate** to the application directory
3. **Start Server**: 
   - Windows: Run `run_server.ps1` or `run_server.bat`
   - Manual: `python -m http.server 8000`
4. **Open Browser**: Navigate to `http://localhost:8000`

### First Time Use
1. Click "New Character" to create your first character
2. Enter character name and basic information
3. Set experience points to gain attribute points
4. Distribute attribute points (40 base + 3 per XP)
5. Add equipment, advantages, and other features
6. Character automatically saves as you make changes

## Usage Guide

### Creating Characters
- **Name & Description**: Start with basic character information
- **Experience Points**: Set XP to determine level and available attribute points
- **Attributes**: Distribute points across 18 attributes (costs increase cumulatively)
- **Equipment**: Add weapons, armor, and gear with special effects
- **Traits**: Add advantages, disadvantages, boons, banes, perks, and flaws

### Managing Health
- **Current HP**: Green segment on health bar
- **Missing HP**: Red segment showing damage taken
- **Reduced Max HP**: Black segment showing lethal damage
- **Damage Input**: Enter amount and click red "Damage" button
- **Healing Input**: Enter amount and click green "Heal" button
- **Lethal Damage**: Reduces maximum HP (use lethal buttons)

### Attribute Management
- **Point Validation**: System prevents overspending attribute points
- **Error Popups**: Clear messages when insufficient points available
- **Auto-Calculation**: Costs and totals update automatically
- **Level Limits**: Maximum attributes adjust with character level

### Equipment & Combat
- **Dual Weapons**: Equip up to 2 weapons simultaneously
- **Armor Requirements**: Heavy armor requires minimum Fortitude
- **Defense Calculations**: Automatic updates with attribute changes
- **Attack Tests**: Input enemy attack rolls to see if they hit

## Customization

### Adding Game Content
- **Edit `gameDatabase.js`**: Add new boons, banes, feats, perks, and flaws
- **Follow Structure**: Use existing entries as templates
- **Power Levels**: Include all applicable power levels with descriptions
- **Attributes**: Specify which attributes can invoke abilities

### Styling Changes
- **Edit `styles.css`**: Modify colors, layouts, and animations
- **CSS Variables**: Use consistent color schemes throughout
- **Responsive Design**: Maintain mobile-friendly layouts
- **Animations**: Add smooth transitions and hover effects

### Functionality Extensions
- **Edit `script.js`**: Add new features and methods
- **Event Listeners**: Hook into existing systems
- **Data Validation**: Extend validation rules
- **Storage**: Add new data types to character objects

## Troubleshooting

### Common Issues
- **Server Won't Start**: Ensure Python is installed and in PATH
- **Data Not Saving**: Check browser local storage permissions
- **Attributes Not Updating**: Verify all required DOM elements exist
- **Health Bar Issues**: Check console for JavaScript errors

### Debug Mode
- **Console Logging**: Extensive logging for troubleshooting
- **Error Notifications**: User-friendly error messages
- **Element Validation**: Automatic checking of required DOM elements
- **Auto-Save Warnings**: Notifications when auto-save setup fails

## Contributing

### Development Guidelines
- **Code Style**: Follow existing JavaScript patterns
- **Error Handling**: Always include try-catch blocks
- **User Feedback**: Provide clear notifications for all actions
- **Mobile First**: Ensure touch-friendly interface design

### Testing
- **Cross-Browser**: Test in multiple browsers
- **Mobile Devices**: Verify responsive design works
- **Data Persistence**: Test character saving/loading
- **Edge Cases**: Test with unusual input values

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or contributions:
- Check the troubleshooting section
- Review console logs for error details
- Ensure all files are properly loaded
- Verify browser compatibility

---

**Open Legend Character Sheet** - Making character management simple and intuitive for the Open Legend RPG system.
