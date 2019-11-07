/**
 * @fileoverview Implements bold WysiwygCommand
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */
import CommandManager from '../commandManager';

/**
 * DestinationLink
 * Crée un lien auto vers une destination selon la sélection
 * @extends Command
 * @module wysiwygCommands/DestinationLink
 * @ignore
 */
const DestinationLink = CommandManager.command('wysiwyg', /** @lends Bold */{
  name: 'DestinationLink',
  keyMap: [],
  /**
   * command handler
   * @param {WysiwygEditor} wwe wysiwygEditor instance
   */
  exec(wwe) {
    const sq = wwe.getEditor();
    wwe.focus();

    console.log(sq.getSelectedText());
  }
});

export default DestinationLink;
