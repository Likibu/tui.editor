/**
 * @fileoverview Implements PopupAddDestinationLink
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */
import $ from 'jquery';
import util from 'tui-code-snippet';

import LayerPopup from './layerpopup';
import i18n from '../i18n';
import uuidv4 from '../uuid';

const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})(\/([^\s]*))?$/;

/**
 * Class PopupAddLink
 * It implements a link Add Popup
 * @param {LayerPopupOption} options - layer popup options
 * @ignore
 */
class PopupAddDestinationLink extends LayerPopup {
  constructor(options) {
    const uuid = uuidv4();
    let settings = options.editor.options.likibu; 
    let popupContent = `
            <div id="addDestinationLink_${uuid}">Loading...</div>
    `;

    options = util.extend({
      header: true,
      title: 'Add automatic destination link',
      className: 'te-popup-add-link tui-editor-popup',
      content: popupContent,
      uuid: uuid
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
    this.uuid = options.uuid;
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

    this.on('shown', () => {
      const sq = this._editor.wwEditor.getEditor();
      const lang = this.detectLang();
      
      $('#addDestinationLink_' + this.uuid).html('Loading...');
      
      $.ajax({
        dataType: 'json',
        url: '/destination/detectWithinText',
        data: {
          term: sq.getSelectedText(),
          lang: lang
        },
        success: (data) => {
          let html = '<label>Best suggestions : </label>';
          html += '<ul>';
          
          $(data.destinations).each((i, el) => {
              html += '<li><a href="#" data-slug="' + el.slug + '" data-lang="' + el.lang + '">' + el.name + ' (' + el.lang + ')</a></li>';
          });
          
          html += '</ul>';
          html += '<label>Other suggestions : </label>';
          html += '<ul>';
          
          $(data.other).each((i, el) => {
              html += '<li><a href="#" data-slug="' + el.slug + '" data-lang="' + el.lang + '">' + el.name + ' (' + el.lang + ')</a></li>';
          });
          
          html += '</ul>';
          $('#addDestinationLink_' + this.uuid).html(html);
          $('#addDestinationLink_' + this.uuid + ' a').click((e) => {
            e.preventDefault();
            const $link = $(e.target);
            this._addLink($link.data('slug'), $link.data('lang'));
          });
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

  _addLink(slug, lang) {
    const linkText = this._editor.getSelectedText().trim();
    let url = '{{landing_search#' + lang + '#' + this.settings[lang].landing_slug + '#{\'where\':\'' + slug + '\'}#}}';
    
    this._eventManager.emit('command', 'AddLink', {
      linkText,
      url
    });
    this.hide();
  }
}

export default PopupAddDestinationLink;
