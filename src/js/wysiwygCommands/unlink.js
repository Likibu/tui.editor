/**
 * @fileoverview Implements bold WysiwygCommand
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */
import CommandManager from '../commandManager';

/**
 * Bold
 * Add bold to selected wysiwyg editor content
 * @extends Command
 * @module wysiwygCommands/Bold
 * @ignore
 */
const Unlink = CommandManager.command('wysiwyg', /** @lends Bold */{
  name: 'Unlink',
  keyMap: [],
  /**
   * command handler
   * @param {WysiwygEditor} wwe wysiwygEditor instance
   */
  exec(wwe) {
    const sq = wwe.getEditor();
    wwe.focus();

    if (sq.hasFormat('a') || sq.hasFormat('a')) {
      sq.changeFormat(null, {tag: 'A'}, sq.getSelection(), true);
    }
  }
});

export default Unlink;
