/**
 * @fileoverview Implements PopupAddLink
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */
import $ from 'jquery';
import util from 'tui-code-snippet';

import LayerPopup from './layerpopup';
import i18n from '../i18n';

const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})(\/([^\s]*))?$/;

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Class PopupAddLink
 * It implements a link Add Popup
 * @param {LayerPopupOption} options - layer popup options
 * @ignore
 */
class PopupAddLink extends LayerPopup {
  constructor(options) {
    let settings = options.editor.options.likibu; 
    const uuid = uuidv4();
    
    let popupContent = `
            <div style="display: none;"><input type="text" class="te-url-input" /></div>
            <label for="type_${uuid}">Page Type</label>
            <select id="type_${uuid}"><option value="">Select page type...</option><option value="content">Content Page</option><option value="tag">Tag Page</option><option value="landing_search">Destination</option><option value="custom">Custom URL</option></select>
            <label for="lang_${uuid}">Language</label>
            <select id="lang_${uuid}"><option value="">Select language...</option>
    `;

    for (var lang in settings) {
      popupContent += '<option value="' + lang + '">' + settings[lang].name + '</option>';
    };
    
    popupContent += `
            </select>
            <div id="section_content_${uuid}" style="display: none;"><label for="content_slug_${uuid}">Content page : </label><select id="content_slug_${uuid}"><option value="">Select content page...</option></select></div>
            <div id="section_tag_${uuid}" style="display: none;"><label for="tag_slug_${uuid}">Tag page : </label><select id="tag_slug_${uuid}"><option value="">Select tag page...</option></select></div>
            <div id="section_destination_${uuid}" style="display: none;"><label for="destination_search_${uuid}">Destination : </label><input type="text" list="destination_list_${uuid}" id="destination_search_${uuid}"><datalist id="destination_list_${uuid}"></datalist><input type="hidden" id="destination_slug_${uuid}"></select>
            <label for="flp_slug_${uuid}">FLP : </label><select id="flp_slug_${uuid}"><option value="">Select FLP...</option></select></div>
            <div id="section_custom_${uuid}" style="display: none;"><label for="url_custom_${uuid}">URL : </label><input type="text" id="url_custom_${uuid}"></div>
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

      // On reset tout (sauf la langue)
      $('#type_' + this.uuid + ', #content_slug_' + this.uuid + ', #tag_slug_' + this.uuid + ', #destination_search_' + this.uuid + ', #flp_slug_' + this.uuid + '').val(''); 
      $('#section_content_' + this.uuid + ', #section_tag_' + this.uuid + ', #section_destination_' + this.uuid + ', #section_custom_' + this.uuid + '').hide();

      if (sq.hasFormat('a')) {
        let sel = sq.getSelection();
        let editedLink = sel.commonAncestorContainer;

        while (editedLink.nodeName !== 'A') {
          editedLink = editedLink.parentElement;
        }

        sel.selectNode(editedLink);
        sq.setSelection(sel);
        let href = $(editedLink).attr('href').replace(/%7B/g, '{').replace(/%7D/g, '}').replace(/%22/g, '"').replace(/&quot;/g, '"');
        
        inputURL.value = href;
        
        let likibuLink = this.getLikibuLink();

        if (likibuLink) {
          $('#type_' + this.uuid + '').val(likibuLink.type);
          $('#lang_' + this.uuid + '').val(likibuLink.lang);
          if ('' !== likibuLink.destination) {
            $('#destination_search_' + this.uuid + '').val(likibuLink.destination);
            this.destinationChanged(false, true, likibuLink.flp);
          }
        } else {
          $('#type_' + this.uuid + '').val('custom');
          $('#lang_' + this.uuid + '').val('fr'); // fake
          $('#url_custom_' + this.uuid + '').val(href);
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
    
        console.log('coucou', this.uuid, $('#type_' + this.uuid + ''))
    $('#type_' + this.uuid + '').change(() => {
      if ($('#lang_' + this.uuid + '').val()) {
        this.typeChanged();
      }
    });
    $('#lang_' + this.uuid + '').change(() => {
      if ($('#type_' + this.uuid + '').val()) {
        this.typeChanged();
      }
    });
    $('#content_slug_' + this.uuid + ', #tag_slug_' + this.uuid + '').change(() => {
      this.setLikibuLink();
    });
    $('#flp_slug_' + this.uuid + '').change(() => {
      this.setLikibuLink();
    });
    $('#url_custom_' + this.uuid + '').on('keyup', () => {
      this.setLikibuLink();
    });
    this.destination_search = '';
    $('#destination_search_' + this.uuid + '').on('keyup', (e) => { this.destinationChanged(e, false); });

    this.on('hidden', () => {
      this._resetInputs();
    });
  }
  
  destinationChanged(e, forceRefresh, flpSlug) {
    let value = $('#destination_search_' + this.uuid + '').val();
    let found = false;
    const uuid = this.uuid;

    $('#destination_list_' + uuid + ' option').each((i, option) => {
      if ($(option).val() == value) {
        found = true;
      }
    });

    if (found || forceRefresh) {
      this.loadFlps($('#lang_' + uuid + '').val(), $('#destination_search_' + uuid + '').val(), flpSlug);
      this.setLikibuLink();
      return e ? e.preventDefault() : false;
    }

    this.destination_search = $('#destination_search_' + uuid + '').val();
    $.ajax({
      dataType: 'json',
      url: '/destination/autocomplete',
      data: {
        lang: $('#lang_' + uuid + '').val(),
        term: value
      },
      success: function(data) {
        let options = '';
        $(data).each(function() {
          options += '<option value="' + this.slug + '">' + this.label + '</option>';
        });
        $('#destination_list_' + uuid + '').html(options);
        $('#destination_search_' + uuid + '').focus();
      }
    });
  }
  
  setLikibuLink() {
    if ('custom' == $('#type_' + this.uuid + '').val()) {
      return this._inputURL.value = $('#url_custom_' + this.uuid + '').val();
    }
    let link = '{{';
    link += $('#type_' + this.uuid + '').val();
    link += '#';
    link += $('#lang_' + this.uuid + '').val();
    link += '#';
    
    switch ($('#type_' + this.uuid + '').val()) {
      case 'content':
        link += $('#content_slug_' + this.uuid + '').val();
        break;
      case 'tag':
        link += $('#tag_slug_' + this.uuid + '').val();
        break;
      case 'landing_search':
        link += this.settings[$('#lang_' + this.uuid + '').val()].landing_slug;
        link += '#';
        link += '{"where":"';
        link += $('#destination_search_' + this.uuid + '').val();
        const flp = $('#flp_slug_' + this.uuid + '').val();
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
    let $type = $('#type_' + this.uuid + '');
    let $lang = $('#lang_' + this.uuid + '');

    switch ($type.val()) {
      case 'content':
        $('#section_content_' + this.uuid + ', #section_lang_' + this.uuid + '').show();
        $('#section_tag_' + this.uuid + ', #section_destination_' + this.uuid + ', #section_custom_' + this.uuid + '').hide();
        $('#tag_slug_' + this.uuid + ', #destination_search_' + this.uuid + ', #flp_slug_' + this.uuid + '').val('');
        this.loadContentPages($lang.val(), slug);
        break;
      case 'tag':
        $('#section_tag_' + this.uuid + ', #section_lang_' + this.uuid + '').show();
        $('#section_content_' + this.uuid + ', #section_destination_' + this.uuid + ', #section_custom_' + this.uuid + '').hide();
        $('#content_slug_' + this.uuid + ', #destination_search_' + this.uuid + ', #flp_slug_' + this.uuid + '').val('');
        this.loadTagPages($lang.val(), slug);
        break;
      case 'landing_search':
        $('#section_destination_' + this.uuid + ', #section_lang_' + this.uuid + '').show();
        $('#section_content_' + this.uuid + ', #section_tag_' + this.uuid + ', #section_custom_' + this.uuid + '').hide();
        $('#content_slug_' + this.uuid + ', #tag_slug_' + this.uuid + '').val('');
        break;
      case 'custom':
        $('#section_custom_' + this.uuid + '').show();
        $('#section_content_' + this.uuid + ', #section_tag_' + this.uuid + ', #section_destination_' + this.uuid + ', #section_lang_' + this.uuid + '').hide();
        $('#content_slug_' + this.uuid + ', #tag_slug_' + this.uuid + ', #destination_search_' + this.uuid + ', #flp_slug_' + this.uuid + '').val('');
      default: 
        break;
    }
    this.loadFlps(false, false, false);
  }
  
  loadContentPages(lang, slug) {
    let $select = $('#content_slug_' + this.uuid + '');
    $select.find('option:not([value=""])').remove();
    
    $(this.settings[lang].content_pages).each(function() {
      $('<option></option>').html(this.title).prop('value', this.slug).appendTo($select);
    });
    
    $select.val(slug);
  }
  
  loadTagPages(lang, slug) {
    let $select = $('#tag_slug_' + this.uuid + '');
    $select.find('option:not([value=""])').remove();
    
    $(this.settings[lang].tag_pages).each(function() {
      $('<option></option>').html(this.title).prop('value', this.slug).appendTo($select);
    });
    
    $select.val(slug);
  }
  
  loadFlps(lang, destination, selection) {
    let $select = $('#flp_slug_' + this.uuid + '');
    $select.find('option:not([value=""])').remove();

    if (lang && destination) {
      $.ajax({
        dataType: 'json',
        url: '/destination/get_flps',
        data: {
          lang: lang,
          slug: destination
        },
        success: (data) => {
          let options = $select.html();
          $(data).each(function() {
            options += '<option value="' + this.slug + '">' + this.slug + '</option>';
          });
          $select.html(options);
        
          if (selection) {
            $select.val(selection);
          }

          this.setLikibuLink();
        }
      });
    }
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
