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
    console.log(settings);
    let popupContent = `
            <div style="display: block;"><input type="text" class="te-url-input" /></div>
            <label for="type">Page Type</label>
            <select id="type"><option value="">Select page type...</option><option value="content">Content Page</option><option value="tag">Tag Page</option><option value="landing_search">Destination</option><option value="custom">Custom URL</option></select>
            <label for="lang">Language</label>
            <select id="lang"><option value="">Select language...</option>
    `;

    for (var lang in settings) {
      popupContent += '<option value="' + lang + '">' + settings[lang].name + '</option>';
    };
    
    popupContent += `
            </select>
            <div id="section_content" style="display: none;"><label for="content_slug">Content page : </label><select id="content_slug"><option value="">Select content page...</option></select></div>
            <div id="section_tag" style="display: none;"><label for="tag_slug">Tag page : </label><select id="tag_slug"><option value="">Select tag page...</option></select></div>
            <div id="section_destination" style="display: none;"><label for="destination_search">Destination : </label><input type="text" list="destination_list" id="destination_search"><datalist id="destination_list"></datalist><input type="hidden" id="destination_slug"></select>
            <label for="flp_slug">FLP : </label><select id="flp_slug"><option value="">Select FLP...</option></select></div>
            <div id="section_custom" style="display: none;"><label for="url_custom">URL : </label><input type="text" id="url_custom"></div>
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
        
        inputURL.value = href;
        
        let likibuLink = this.getLikibuLink();

        if (likibuLink) {
          $('#type').val(likibuLink.type);
          $('#lang').val(likibuLink.lang);
        } else {
          $('#type').val('custom');
          $('#type').val('fr'); // fake
        }
        
        this.typeChanged(likibuLink.slug, likibuLink.destination, likibuLink.flp);
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
        this.typeChanged();
      }
    });
    $('#lang').change(() => {
      if ($('#type').val()) {
        this.typeChanged();
      }
    });
    $('#content_slug, #tag_slug').change(() => {
      this.setLikibuLink();
    });
    $('#flp_slug').change(() => {
      this.setLikibuLink();
    });
    $('#url_custom').on('keyup', () => {
      this.setLikibuLink();
    });
    this.destination_search = '';
    $('#destination_search').on('keyup', (e) => {
      let value = $('#destination_search').val();
      let found = false;
      
      $('#destination_list option').each((i, option) => {
        if ($(option).val() == value) {
          found = true;
        }
      });
      
      if (found) {
        this.loadFlps($('#lang').val(), $('#destination_search').val());
        this.setLikibuLink();
        return e.preventDefault();
      }
      
      this.destination_search = $('#destination_search').val();
      $.ajax({
        dataType: 'json',
        url: '/destination/autocomplete',
        data: {
          lang: $('#lang').val(),
          term: value
        },
        success: function(data) {
          let options = '';
          $(data).each(function() {
            options += '<option value="' + this.slug + '">' + this.label + '</option>';
          });
          $('#destination_list').html(options);
          $('#destination_search').focus();
        }
      });
    });

    this.on('hidden', () => {
      this._resetInputs();
    });
  }
  
  setLikibuLink() {
    if ('custom' == $('#type').val()) {
      return this._inputURL.value = $('#url_custom').val();
    }
    let link = '{{';
    link += $('#type').val();
    link += '#';
    link += $('#lang').val();
    link += '#';
    
    switch ($('#type').val()) {
      case 'content':
        link += $('#content_slug').val();
        break;
      case 'tag':
        link += $('#tag_slug').val();
        break;
      case 'landing_search':
        link += this.settings[$('#lang').val()].landing_slug;
        link += '#';
        link += '{"where":"';
        link += $('#destination_search').val();
        const flp = $('#flp_slug').val();
        if (flp) {
          link += '/';
          link += flp;
        }
        link += '"}';
        link += '#';
        break;
    }
    
    link += '}}';
    
    this._inputURL.value = link;
  }
  
  getLikibuLink() {
    const href = this._inputURL.value;

    if (href.match(/^{{/g)) {
      const link = href.replace(/(^{{)(.*)(}}$)$/g, '$2');
      let [linkType, lang, slug, destinationSettings] = link.split('#');
      let [destSlug, flpSlug] = ['', ''];

      if ('landing_search' === linkType) {
        destinationSettings = JSON.parse(destinationSettings.replace(/'/g, '"'));
        [destSlug, flpSlug] = destinationSettings.where.split('/');
      }

      return {
        type: linkType,
        lang: lang,
        slug: slug,
        destination: destSlug,
        flp: flpSlug
      };
    }
    
    return false;
  }

  typeChanged(slug, destination, flp) {
    let $type = $('#type');
    let $lang = $('#lang');

    switch ($type.val()) {
      case 'content':
        $('#section_content, #section_lang').show();
        $('#section_tag, #section_destination, #section_custom').hide();
        this.loadContentPages($lang.val(), slug);
        break;
      case 'tag':
        $('#section_tag, #section_lang').show();
        $('#section_content, #section_destination, #section_custom').hide();
        this.loadTagPages($lang.val(), slug);
        break;
      case 'landing_search':
        $('#section_destination, #section_lang').show();
        $('#section_content, #section_tag, #section_custom').hide();
        break;
      case 'custom':
        $('#section_custom').show();
        $('#section_content, #section_tag, #section_destination, #section_lang').hide();
      default: 
        break;
    }
  }
  
  loadContentPages(lang, slug) {
    let $select = $('#content_slug');
    $select.find('option:not([value=""])').remove();
    
    $(this.settings[lang].content_pages).each(function() {
      $('<option></option>').html(this.title).prop('value', this.slug).appendTo($select);
    });
    
    $select.val(slug);
  }
  
  loadTagPages(lang, slug) {
    let $select = $('#tag_slug');
    $select.find('option:not([value=""])').remove();
    
    $(this.settings[lang].tag_pages).each(function() {
      $('<option></option>').html(this.title).prop('value', this.slug).appendTo($select);
    });
    
    $select.val(slug);
  }
  
  loadFlps(lang, destination) {
    $.ajax({
      dataType: 'json',
      url: '/destination/get_flps',
      data: {
        lang: lang,
        slug: destination
      },
      success: function(data) {
        let $select = $('#flp_slug');
        $select.find('option:not([value=""])').remove();
        let options = $select.html();
        $(data).each(function() {
          options += '<option value="' + this.slug + '">' + this.slug + '</option>';
        });
        $select.html(options);
      }
    });
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
