/**
 * @fileoverview Implements PopupAddLink
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
class PopupAddLink extends LayerPopup {
  constructor(options) {
    let settings = options.editor.options.likibu;
    let popupContent = `
            <input type="text" class="te-url-input" />
            <label for="type">Page Type</label>
            <select id="type"><option value="">Select page type...</option><option value="content">Content Page</option><option value="tag">Tag Page</option><option value="landing_search">Destination</option></select>
            <label for="lang">Language</label>
            <select id="lang"><option value="">Select language...</option>
    `;

    for (var lang in settings) {
      popupContent += '<option value="' + lang + '">' + settings[lang].name + '</option>';
    };
    
    popupContent += `
            </select>
            <div id="section_content" style="display: none;"><label for="content_slug">Content page : </label><select id="content_slug"></select></div>
            <div id="section_tag" style="display: none;"><label for="tag_slug">Tag page : </label><select id="tag_slug"></select></div>
            <div id="section_destination" style="display: none;"><label for="destination_slug">Destination : </label><select id="destination_slug"></select>
            <label for="flp_slug">FLP : </label><select id="flp_slug"></select></div>
            <label for="linkText">${i18n.get('Link text')}</label>
            <input type="text" class="te-link-text-input" readonly />
            <div class="te-button-section">
                <button type="button" class="te-ok-button">${i18n.get('OK')}</button>
                <button type="button" class="te-close-button">${i18n.get('Cancel')}</button>
            </div>
    `;

    options = util.extend({
      header: true,
      title: i18n.get('Insert link'),
      className: 'te-popup-add-link tui-editor-popup',
      content: popupContent
    }, options);
    super(options);
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
    this._inputText = el.querySelector('.te-link-text-input');
    this._inputURL = el.querySelector('.te-url-input');
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
      const inputText = this._inputText;
      const inputURL = this._inputURL;
      const sq = this._editor.wwEditor.getEditor();

      if (sq.hasFormat('a')) {
        let sel = sq.getSelection();
        let editedLink = sel.commonAncestorContainer;

        while (editedLink.nodeName !== 'A') {
          editedLink = editedLink.parentElement;
        }

        sel.selectNode(editedLink);
        sq.setSelection(sel);
        let href = $(editedLink).attr('href').replace(/%7B/g, '{').replace(/%7D/g, '}');

        if (href.match(/^{{/g)) {
            let link = href.replace(/(^{{)(.*)(}}$)$/g, '$2');
            let [linkType, lang, slug, destinationSettings] = link.split('#');
            
            if ('landing_search' === linkType) {
                destinationSettings = JSON.parse(destinationSettings.replace(/'/g, '"'));
                let [destSlug, flpSlug] = destinationSettings.where.split('/');
            }
            
            $('#type').val(linkType).trigger('change');
            $('#lang').val(lang).trigger('change');
        }
        
        inputURL.value = href;
      }

      const selectedText = this._editor.getSelectedText().trim();

      inputText.value = selectedText;
      if (URL_REGEX.exec(selectedText)) {
        inputURL.value = selectedText;
      }

      inputURL.focus();
    });
    
    $('#type').change(() => {
        if ($('#lang').val()) {
            this.updatedType();
        }
    });
    $('#lang').change(() => {
        if ($('#type').val()) {
            this.updatedType();
        }
    });

    this.on('hidden', () => {
      this._resetInputs();
    });
  }

  updatedType() {
    let $type = $('#type');
    let $lang = $('#lang');

    switch ($type.val()) {
      case 'content':
        $('#section_content').show();
        $('#section_tag, #section_destination').hide();
        this.loadContentPages($lang.val());
        break;
      case 'tag':
        $('#section_tag').show();
        $('#section_content, #section_destination').hide();
        this.loadTagPages($lang.val());
        break;
      case 'landing_search':
        $('#section_destination').show();
        $('#section_content, #section_tag').hide();
        this.loadDestinations($lang.val());
        break;
      default: 
        break;
    }
  }
  
  loadContentPages(lang) {
    $.ajax({
      dataType: "json",
      url: '/_ui/get_pages',
      data: {lang: lang},
      success: function(data) {
          
      }
    });
  }
  
  loadTagPages(lang) {
    $.ajax({
      dataType: "json",
      url: '/_ui/get_tags',
      data: {lang: lang},
      success: function(data) {
          console.log(data);
      }
    });
  }
  
  loadDestinations(lang) {
      
  }
  
  loadFlps(lang, destination) {
      
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
    eventManager.listen('openPopupAddLink', () => {
      eventManager.emit('closeAllPopup');
      this.show();
    });
  }

  _addLink() {
    const {url, linkText} = this._getValue();

    this._clearValidationStyle();

    if (linkText.length < 1) {
      $(this._inputText).addClass('wrong');

      return;
    }
    if (url.length < 1) {
      $(this._inputURL).addClass('wrong');

      return;
    }

    this._eventManager.emit('command', 'AddLink', {
      linkText,
      url
    });
    this.hide();
  }

  _getValue() {
    const url = this._inputURL.value;
    const linkText = this._inputText.value;

    return {
      url,
      linkText
    };
  }

  _clearValidationStyle() {
    $(this._inputURL).removeClass('wrong');
    $(this._inputText).removeClass('wrong');
  }

  _resetInputs() {
    this._inputText.value = '';
    this._inputURL.value = '';
    this._clearValidationStyle();
  }
}

export default PopupAddLink;
