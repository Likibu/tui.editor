/**
 * @fileoverview Implements PopupAddDestinationLink
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */
import $ from 'jquery';
import util from 'tui-code-snippet';

import LayerPopup from './layerpopup';
import i18n from '../i18n';

const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})(\/([^\s]*))?$/;

/**
 * Class PopupAddLink
 * It implements a link Add Popup
 * @param {LayerPopupOption} options - layer popup options
 * @ignore
 */
class PopupAddDestinationLink extends LayerPopup {
  constructor(options) {
    let settings = options.editor.options.likibu; 
    let popupContent = `
            <div id="addDestinationLink">Loading...</div>
            <div class="te-button-section">
                <button type="button" class="te-ok-button">${i18n.get('OK')}</button>
                <button type="button" class="te-close-button">${i18n.get('Cancel')}</button>
            </div>
    `;

    options = util.extend({
      header: true,
      title: 'Add automatic destination link',
      className: 'te-popup-add-link tui-editor-popup',
      content: popupContent
    }, options);
    super(options);

    this.settings = settings;
  }

  /**
   * init instance.
   * store properties & prepare before initialize DOM
   * @param {LayerPopupOption} options - layer popup options
   * @private
   * @override
   */
  _initInstance(options) {
    super._initInstance(options);

    this._editor = options.editor;
    this._eventManager = options.editor.eventManager;
  }

  /**
   * initialize DOM, render popup
   * @private
   * @override
   */
  _initDOM() {
    super._initDOM();

    const el = this.$el.get(0);
  }

  /**
   * bind DOM events
   * @private
   * @override
   */
  _initDOMEvent() {
    super._initDOMEvent();

    this.on('click .te-close-button', () => this.hide());
    this.on('click .te-ok-button', () => this._addLink());

    this.on('shown', () => {
      const sq = this._editor.wwEditor.getEditor();
      const lang = this.detectLang();
      
      $.ajax({
        dataType: 'json',
        url: '/destination/detectWithinText',
        data: {
          term: sq.getSelectedText()
        },
        success: function(data) {
          console.log(data);
        }
      });
    });
  }
  
  detectLang() {
    let lang = false;
    $('input, select').each(function() {
      if (false === lang && (this.name.match(/\[lang\]/g) || this.name.match(/\[culture\]/g))) {
        lang = $(this).val();
      }
    });
    
    return lang;
  }
  
  /**
   * bind editor events
   * @private
   * @override
   */
  _initEditorEvent() {
    super._initEditorEvent();

    const eventManager = this._eventManager;
    eventManager.listen('focus', () => this.hide());
    eventManager.listen('closeAllPopup', () => this.hide());
    eventManager.listen('openPopupAddDestinationLink', () => {
      eventManager.emit('closeAllPopup');
      this.show();
    });
  }

  _addLink() {
    const {url, linkText} = {"a": "@todo", "b": "@todo"};

    this._clearValidationStyle();

    if (linkText.length < 1) {
      $(this._inputText).addClass('wrong');

      return;
    }
    if (url.length < 1) {
      $(this._inputURL).addClass('wrong');

      return;
    }

    this._eventManager.emit('command', 'AddDestinationLink', {
      linkText,
      url
    });
    this.hide();
  }
}

export default PopupAddDestinationLink;
