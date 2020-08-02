function createNormalGrammar() {
  const raw = {
    newline: /^\n+/,
    code: /^( {4}[^\n]+\n*)+/,
    fences: /^ {0,3}(`{3,}|~{3,})([^`~\n]*)\n(?:|([\s\S]*?)\n)(?: {0,3}\1[~`]* *(?:\n+|$)|$)/,
    hr: /^ {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(?:\n+|$)/,
    heading: /^ {0,3}(#{1,6}) +([^\n]*?)(?: +#+)? *(?:\n+|$)/,
    blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
    list: /^( {0,3})(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
    html:
      '^ {0,3}(?:' + // optional indentation
      '<(script|pre|style)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)' + // (1)
      '|comment[^\\n]*(\\n+|$)' + // (2)
      '|<\\?[\\s\\S]*?\\?>\\n*' + // (3)
      '|<![A-Z][\\s\\S]*?>\\n*' + // (4)
      '|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>\\n*' + // (5)
      '|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:\\n{2,}|$)' + // (6)
      '|<(?!script|pre|style)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:\\n{2,}|$)' + // (7) open tag
      '|</(?!script|pre|style)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:\\n{2,}|$)' + // (7) closing tag
      ')',
    def: /^ {0,3}\[(label)\]: *\n? *<?([^\s>]+)>?(?:(?: +\n? *| *\n *)(title))? *(?:\n+|$)/,
    nptable: noop,
    table: noop,
    lheading: /^([^\n]+)\n {0,3}(=+|-+) *(?:\n+|$)/,
    // regex template, placeholders will be replaced according to different paragraph
    // interruption rules of commonmark and the original markdown spec:
    _paragraph: /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html)[^\n]+)*)/,
    text: /^[^\n]+/,
    _label: /(?!\s*\])(?:\\[\[\]]|[^\[\]])+/,
    _title: /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/,
    bullet: /(?:[*+-]|\d{1,9}\.)/,
    _comment: /<!--(?!-?>)[\s\S]*?-->/
  }
  //prettier-ignore
  const _tag =
    'address|article|aside|base|basefont|blockquote|body|caption' +
    '|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption' +
    '|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe' +
    '|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option' +
    '|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr' +
    '|track|ul'

  const def = edit(raw.def)
    .replace('label', raw._label)
    .replace('title', raw._title)
    .getRegex()

  const item = edit(/^( *)(bull) ?[^\n]*(?:\n(?!\1bull ?)[^\n]*)*/, 'gm')
    .replace(/bull/g, raw.bullet)
    .getRegex()

  const list = edit(raw.list)
    .replace(/bull/g, raw.bullet)
    .replace(
      'hr',
      '\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))'
    )
    .replace('def', `\\n+(?=${def.source})`)
    .getRegex()

  const html = edit(raw.html, 'i')
    .replace('comment', raw._comment)
    .replace('tag', _tag)
    .replace(
      'attribute',
      / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/
    )
    .getRegex()

  const paragraph = edit(raw._paragraph)
    .replace('hr', raw.hr)
    .replace('heading', ' {0,3}#{1,6} +')
    .replace('|lheading', '') // setex headings don't interrupt commonmark paragraphs
    .replace('blockquote', ' {0,3}>')
    .replace('fences', ' {0,3}(?:`{3,}|~{3,})[^`\\n]*\\n')
    .replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
    .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|!--)')
    .replace('tag', _tag) // pars can be interrupted by type (6) html blocks
    .getRegex()

  const blockquote = edit(raw.blockquote)
    .replace('paragraph', paragraph)
    .getRegex()
  return {
    ...raw,
    def,
    item,
    list,
    html,
    paragraph,
    blockquote
  }
}

function createInlineGrammar() {
  const raw = {
    escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
    autolink: /^<(scheme:[^\s\x00-\x1f<>]*|email)>/,
    url: noop,
    tag:
      '^comment' +
      '|^</[a-zA-Z][\\w:-]*\\s*>' + // self-closing tag
      '|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>' + // open tag
      '|^<\\?[\\s\\S]*?\\?>' + // processing instruction, e.g. <?php ?>
      '|^<![a-zA-Z]+\\s[\\s\\S]*?>' + // declaration, e.g. <!DOCTYPE html>
      '|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>', // CDATA section
    link: /^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/,
    reflink: /^!?\[(label)\]\[(?!\s*\])((?:\\[\[\]]?|[^\[\]\\])+)\]/,
    nolink: /^!?\[(?!\s*\])((?:\[[^\[\]]*\]|\\[\[\]]|[^\[\]])*)\](?:\[\])?/,
    strong: /^__([^\s_])__(?!_)|^\*\*([^\s*])\*\*(?!\*)|^__([^\s][\s\S]*?[^\s])__(?!_)|^\*\*([^\s][\s\S]*?[^\s])\*\*(?!\*)/,
    em: /^_([^\s_])_(?!_)|^\*([^\s*<\[])\*(?!\*)|^_([^\s<][\s\S]*?[^\s_])_(?!_|[^\spunctuation])|^_([^\s_<][\s\S]*?[^\s])_(?!_|[^\spunctuation])|^\*([^\s<"][\s\S]*?[^\s\*])\*(?!\*|[^\spunctuation])|^\*([^\s*"<\[][\s\S]*?[^\s])\*(?!\*)/,
    code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
    br: /^( {2,}|\\)\n(?!\s*$)/,
    del: noop,
    text: /^(`+|[^`])(?:[\s\S]*?(?:(?=[\\<!\[`*]|\b_|$)|[^ ](?= {2,}\n))|(?= {2,}\n))/,
    _escapes: /\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g,
    _scheme: /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/,
    _email: /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/,
    _attribute: /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/,
    _label: /(?:\[[^\[\]]*\]|\\.|`[^`]*`|[^\[\]\\`])*?/,
    _href: /<(?:\\[<>]?|[^\s<>\\])*>|[^\s\x00-\x1f]*/,
    _title: /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/
  }

  // list of punctuation marks from common mark spec
  // without ` and ] to workaround Rule 17 (inline code blocks/links)
  const _punctuation = '!"#$%&\'()*+,\\-./:;<=>?@\\[^_{|}~'

  const em = edit(raw.em)
    .replace(/punctuation/g, _punctuation)
    .getRegex()

  const autolink = edit(raw.autolink)
    .replace('scheme', raw._scheme)
    .replace('email', raw._email)
    .getRegex()

  const tag = edit(raw.tag)
    .replace('comment', block._comment)
    .replace('attribute', raw._attribute)
    .getRegex()

  const link = edit(raw.link)
    .replace('label', raw._label)
    .replace('href', raw._href)
    .replace('title', raw._title)
    .getRegex()

  const reflink = edit(raw.reflink).replace('label', raw._label).getRegex()

  const inline = {
    ...raw,
    em,
    autolink,
    tag,
    link,
    reflink
  }

  /**
   * GFM Inline Grammar
   */

  const inlineGFMRaw = {
    ...inline,
    escape: edit(inline.escape).replace('])', '~|])').getRegex(),
    _extended_email: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
    url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,
    _backpedal: /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/,
    del: /^~+(?=\S)([\s\S]*?\S)~+/,
    text: /^(`+|[^`])(?:[\s\S]*?(?:(?=[\\<!\[`*~]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))|(?= {2,}\n|[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))/
  }

  const url = edit(inlineGFMRaw.url, 'i')
    .replace('email', inlineGFMRaw._extended_email)
    .getRegex()

  const inlineGFM = {
    ...inlineGFMRaw,
    url
  }
  const inlineBreaks = {
    ...inlineGFM,
    br: edit(inline.br).replace('{2,}', '*').getRegex(),
    text: edit(inlineGFM.text)
      .replace('\\b_', '\\b_| {2,}\\n')
      .replace(/\{2,\}/g, '*')
      .getRegex()
  }
  return {inline, inlineGFM, inlineBreaks}
}

const block = createNormalGrammar()

/**
 * GFM Block Grammar
 */

const gfmGrammarRules = {
  ...block,
  nptable: /^ *([^|\n ].*\|.*)\n *([-:]+ *\|[-| :]*)(?:\n((?:.*[^>\n ].*(?:\n|$))*)\n*|$)/,
  table: /^ *\|(.+)\n *\|?( *[-:]+[-| :]*)(?:\n((?: *[^>\n ].*(?:\n|$))*)\n*|$)/
}

const {inline, inlineGFM} = createInlineGrammar()

export type Token =
  | {type: 'space'}
  | {
      type: 'code'
      codeBlockStyle: 'indented'
      text: string
    }
  | {
      type: 'code'
      lang: string
      text: string
    }
  | {
      type: 'heading'
      depth: number
      text: string
    }
  | {
      type: 'table'
      header: string[]
      align: Array<'left' | 'right' | 'center' | null>
      cells: string[][]
    }
  | {type: 'hr'}
  | {type: 'blockquote_start'}
  | {type: 'blockquote_end'}
  | {
      type: 'list_start'
      ordered: true
      start: number
      loose: boolean
    }
  | {
      type: 'list_start'
      ordered: false
      start: string
      loose: boolean
    }
  | {
      type: 'list_item_start'
      task: false
      checked: undefined
      loose: boolean
    }
  | {
      type: 'list_item_start'
      task: true
      checked: boolean
      loose: boolean
    }
  | {type: 'list_item_end'}
  | {type: 'list_end'}
  | {
      type: 'html'
      pre: boolean
      text: string
    }
  | {
      type: 'paragraph'
      text: string
    }
  | {
      type: 'text'
      text: string
    }

type LinkToken = {
  href: string
  title: string
}

export type TokenList = Array<Token> & {
  links: {[tag: string]: LinkToken}
}

export function parseToAST(
  src: string,
  {smartLists = false}: {smartLists?: boolean} = {}
) {
  const tokens: Token[] = []
  const links = new Map<string, LinkToken>()
  const rules = gfmGrammarRules
  src = src.replace(/\r\n|\r/g, '\n').replace(/\t/g, '  ')
  lexerToken(src, true)
  tokens.reverse()
  const inlineLexerOpts = {
    inLink: false,
    inRawBlock: false
  }
  return astLoop()

  function mangleLinks(text: string) {
    let out = ''
    const l = text.length
    let i = 0
    let ch

    for (; i < l; i++) {
      ch = text.charCodeAt(i)
      if (Math.random() > 0.5) {
        ch = `x${ch.toString(16)}`
      }
      out += `&#${ch};`
    }

    return out
  }
  function smartypants(text: string) {
    return (
      text
        // em-dashes
        .replace(/---/g, '\u2014')
        // en-dashes
        .replace(/--/g, '\u2013')
        // opening singles
        .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
        // closing singles & apostrophes
        .replace(/'/g, '\u2019')
        // opening doubles
        .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
        // closing doubles
        .replace(/"/g, '\u201d')
        // ellipses
        .replace(/\.{3}/g, '\u2026')
    )
  }
  function lexerToken(src: string, top: boolean) {
    src = src.replace(/^ +$/gm, '')
    let next
    let loose
    let cap
    let bull
    let b
    let item
    let listStart
    let listItems
    let t
    let space
    let i
    let tag
    let l
    let isordered
    let istask
    let ischecked

    while (src) {
      // newline
      if ((cap = rules.newline.exec(src))) {
        src = src.substring(cap[0].length)
        if (cap[0].length > 1) {
          tokens.push({
            type: 'space'
          })
        }
      }

      // code
      if ((cap = rules.code.exec(src))) {
        const lastToken = tokens[tokens.length - 1]
        src = src.substring(cap[0].length)
        // An indented code block cannot interrupt a paragraph.
        if (lastToken && lastToken.type === 'paragraph') {
          lastToken.text += `\n${cap[0].trimRight()}`
        } else {
          cap = cap[0].replace(/^ {4}/gm, '')
          tokens.push({
            type: 'code',
            codeBlockStyle: 'indented',
            text: rtrim(cap, '\n')
          })
        }
        continue
      }

      // fences
      if ((cap = rules.fences.exec(src))) {
        src = src.substring(cap[0].length)
        tokens.push({
          type: 'code',
          lang: cap[2] ? cap[2].trim() : cap[2],
          text: cap[3] || ''
        })
        continue
      }

      // heading
      if ((cap = rules.heading.exec(src))) {
        src = src.substring(cap[0].length)
        tokens.push({
          type: 'heading',
          depth: cap[1].length,
          text: cap[2]
        })
        continue
      }

      // table no leading pipe (gfm)
      if ((cap = rules.nptable.exec(src))) {
        item = {
          type: 'table',
          header: splitCells(cap[1].replace(/^ *| *\| *$/g, '')),
          align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
          cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : []
        }

        if (item.header.length === item.align.length) {
          src = src.substring(cap[0].length)

          for (i = 0; i < item.align.length; i++) {
            if (/^ *-+: *$/.test(item.align[i])) {
              item.align[i] = 'right'
            } else if (/^ *:-+: *$/.test(item.align[i])) {
              item.align[i] = 'center'
            } else if (/^ *:-+ *$/.test(item.align[i])) {
              item.align[i] = 'left'
            } else {
              item.align[i] = null
            }
          }

          for (i = 0; i < item.cells.length; i++) {
            item.cells[i] = splitCells(item.cells[i], item.header.length)
          }

          tokens.push(item)

          continue
        }
      }

      // hr
      if ((cap = rules.hr.exec(src))) {
        src = src.substring(cap[0].length)
        tokens.push({
          type: 'hr'
        })
        continue
      }

      // blockquote
      if ((cap = rules.blockquote.exec(src))) {
        src = src.substring(cap[0].length)

        tokens.push({
          type: 'blockquote_start'
        })

        cap = cap[0].replace(/^ *> ?/gm, '')

        // Pass `top` to keep the current
        // "toplevel" state. This is exactly
        // how markdown.pl works.
        lexerToken(cap, top)

        tokens.push({
          type: 'blockquote_end'
        })

        continue
      }

      // list
      if ((cap = rules.list.exec(src))) {
        src = src.substring(cap[0].length)
        bull = cap[2]
        isordered = bull.length > 1

        listStart = {
          type: 'list_start',
          ordered: isordered,
          start: isordered ? +bull : '',
          loose: false
        }

        tokens.push(listStart)

        // Get each top-level item.
        cap = cap[0].match(rules.item)

        listItems = []
        next = false
        l = cap.length
        i = 0

        for (; i < l; i++) {
          item = cap[i]

          // Remove the list item's bullet
          // so it is seen as the next token.
          space = item.length
          item = item.replace(/^ *([*+-]|\d+\.) */, '')

          // Outdent whatever the
          // list item contains. Hacky.
          if (~item.indexOf('\n ')) {
            space -= item.length
            item = item.replace(new RegExp(`^ {1,${space}}`, 'gm'), '')
          }

          // Determine whether the next list item belongs here.
          // Backpedal if it does not belong in this list.
          if (i !== l - 1) {
            b = block.bullet.exec(cap[i + 1])[0]
            if (
              bull.length > 1
                ? b.length === 1
                : b.length > 1 || (smartLists && b !== bull)
            ) {
              src = cap.slice(i + 1).join('\n') + src
              i = l - 1
            }
          }

          // Determine whether item is loose or not.
          // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
          // for discount behavior.
          loose = next || /\n\n(?!\s*$)/.test(item)
          if (i !== l - 1) {
            next = item.charAt(item.length - 1) === '\n'
            if (!loose) loose = next
          }

          if (loose) {
            listStart.loose = true
          }

          // Check for task list items
          istask = /^\[[ xX]\] /.test(item)
          ischecked = undefined
          if (istask) {
            ischecked = item[1] !== ' '
            item = item.replace(/^\[[ xX]\] +/, '')
          }

          t = {
            type: 'list_item_start',
            task: istask,
            checked: ischecked,
            loose
          }

          listItems.push(t)
          tokens.push(t)

          // Recurse.
          lexerToken(item, false)

          tokens.push({
            type: 'list_item_end'
          })
        }

        if (listStart.loose) {
          l = listItems.length
          i = 0
          for (; i < l; i++) {
            listItems[i].loose = true
          }
        }

        tokens.push({
          type: 'list_end'
        })

        continue
      }

      // html
      if ((cap = rules.html.exec(src))) {
        src = src.substring(cap[0].length)
        tokens.push({
          type: 'html',
          pre: cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style',
          text: cap[0]
        })
        continue
      }

      // def
      if (top && (cap = rules.def.exec(src))) {
        src = src.substring(cap[0].length)
        if (cap[3]) cap[3] = cap[3].substring(1, cap[3].length - 1)
        tag = cap[1].toLowerCase().replace(/\s+/g, ' ')
        if (!links.has(tag)) {
          links.set(tag, {
            href: cap[2],
            title: cap[3]
          })
        }
        continue
      }

      // table (gfm)
      if ((cap = rules.table.exec(src))) {
        item = {
          type: 'table',
          header: splitCells(cap[1].replace(/^ *| *\| *$/g, '')),
          align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
          cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : []
        }

        if (item.header.length === item.align.length) {
          src = src.substring(cap[0].length)

          for (i = 0; i < item.align.length; i++) {
            if (/^ *-+: *$/.test(item.align[i])) {
              item.align[i] = 'right'
            } else if (/^ *:-+: *$/.test(item.align[i])) {
              item.align[i] = 'center'
            } else if (/^ *:-+ *$/.test(item.align[i])) {
              item.align[i] = 'left'
            } else {
              item.align[i] = null
            }
          }

          for (i = 0; i < item.cells.length; i++) {
            item.cells[i] = splitCells(
              item.cells[i].replace(/^ *\| *| *\| *$/g, ''),
              item.header.length
            )
          }

          tokens.push(item)

          continue
        }
      }

      // lheading
      if ((cap = rules.lheading.exec(src))) {
        src = src.substring(cap[0].length)
        tokens.push({
          type: 'heading',
          depth: cap[2].charAt(0) === '=' ? 1 : 2,
          text: cap[1]
        })
        continue
      }

      // top-level paragraph
      if (top && (cap = rules.paragraph.exec(src))) {
        src = src.substring(cap[0].length)
        tokens.push({
          type: 'paragraph',
          text:
            cap[1].charAt(cap[1].length - 1) === '\n'
              ? cap[1].slice(0, -1)
              : cap[1]
        })
        continue
      }

      // text
      if ((cap = rules.text.exec(src))) {
        // Top-level should never reach here.
        src = src.substring(cap[0].length)
        tokens.push({
          type: 'text',
          text: cap[0]
        })
        continue
      }

      if (src) {
        throw new Error(`Infinite loop on byte: ${src.charCodeAt(0)}`)
      }
    }
  }
  function astLoop() {
    let token = tokens.pop()
    const out: AstToken[] = []
    while (token) {
      out.push(...parserToken())
      token = tokens.pop()
    }
    return out
    function next() {
      token = tokens.pop()
      return token
    }
    function peek() {
      return tokens[tokens.length - 1]
    }
    function parseText() {
      //@ts-ignore
      let body = token.text

      while (peek().type === 'text') {
        //@ts-ignore
        body += `\n${next().text}`
      }

      return inlineTokenizer(body)
    }
    function parserToken() {
      switch (token.type) {
        case 'space': {
          return [ast.space()]
        }
        case 'hr': {
          return [ast.hr()]
        }
        case 'heading': {
          return [ast.heading(inlineTokenizer(token.text), token.depth)]
        }
        case 'code': {
          //@ts-ignore
          return [ast.code(token.text, token.lang, token.escaped)]
        }
        case 'table': {
          const header = []
          const body = []

          // header
          const cell = []
          for (let i = 0; i < token.header.length; i++) {
            cell.push(
              ast.tablecell(inlineTokenizer(token.header[i]), {
                header: true,
                align: token.align[i]
              })
            )
          }
          header.push(ast.tablerow(cell))

          for (let i = 0; i < token.cells.length; i++) {
            const row = token.cells[i]

            const cell = []
            for (let j = 0; j < row.length; j++) {
              cell.push(
                ast.tablecell(inlineTokenizer(row[j]), {
                  header: false,
                  align: token.align[j]
                })
              )
            }

            body.push(ast.tablerow(cell))
          }
          return [ast.table(header, body)]
        }
        case 'blockquote_start': {
          const body = []

          while (next().type !== 'blockquote_end') {
            body.push(...parserToken())
          }

          return [ast.blockquote(body)]
        }
        case 'list_start': {
          const body = []
          const ordered = token.ordered
          const start = token.start

          while (next().type !== 'list_end') {
            body.push(...parserToken())
          }

          return [ast.list(body, ordered, start)]
        }
        case 'list_item_start': {
          const body = []
          const loose = token.loose
          const checked = token.checked
          const task = token.task

          if (token.task) {
            if (loose) {
              if (peek().type === 'text') {
                body.push(ast.checkbox(checked))
                // const nextToken = peek()
                // nextToken.text = `${renderer.checkbox(checked)} ${
                //   nextToken.text
                // }`
              } else {
                body.push(ast.checkbox(checked))
                // tokens.push({
                //   type: 'text',
                //   text: renderer.checkbox(checked)
                // })
              }
            } else {
              body.push(ast.checkbox(checked))
            }
          }

          while (next().type !== 'list_item_end') {
            body.push(
              //@ts-ignore
              ...(!loose && token.type === 'text' ? parseText() : parserToken())
            )
          }
          return [ast.listitem(body, task, checked)]
        }
        case 'html': {
          return [ast.html(token.text)]
        }
        case 'paragraph': {
          return [ast.paragraph(inlineTokenizer(token.text))]
        }
        case 'text': {
          return [ast.paragraph(parseText())]
        }
        default:
          throw Error('Token not found')
      }
    }
  }
  function inlineTokenizer(src: string): AstToken[] {
    function on(rule, cb: (cap: RegExpExecArray) => AstToken) {
      if (skip) return
      let cap
      if (Array.isArray(rule)) {
        for (const subrule of rule) {
          cap = subrule.exec(src)
          if (cap) break
        }
      } else {
        cap = rule.exec(src)
      }
      if (cap) {
        const result = cb(cap)
        out.push(result)
        skip = true
      }
    }
    const opts = inlineLexerOpts
    const rules: {
      [key: string]: {
        exec(string: string): RegExpExecArray | void
      }
      //@ts-ignore
    } = inlineGFM
    const out = []
    let skip = false

    while (src) {
      skip = false
      on(rules.escape, cap => {
        src = src.substring(cap[0].length)
        return ast.escape(escape(cap[1]))
      })
      on(rules.tag, cap => {
        if (!opts.inLink && /^<a /i.test(cap[0])) {
          opts.inLink = true
        } else if (opts.inLink && /^<\/a>/i.test(cap[0])) {
          opts.inLink = false
        }
        if (!opts.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
          opts.inRawBlock = true
        } else if (
          opts.inRawBlock &&
          /^<\/(pre|code|kbd|script)(\s|>)/i.test(cap[0])
        ) {
          opts.inRawBlock = false
        }

        src = src.substring(cap[0].length)
        return ast.tag(cap[0])
      })
      on(rules.link, cap => {
        const lastParenIndex = findClosingBracket(cap[2], '()')
        if (lastParenIndex > -1) {
          const start = cap[0].indexOf('!') === 0 ? 5 : 4
          const linkLen = start + cap[1].length + lastParenIndex
          cap[2] = cap[2].substring(0, lastParenIndex)
          cap[0] = cap[0].substring(0, linkLen).trim()
          cap[3] = ''
        }
        src = src.substring(cap[0].length)
        opts.inLink = true
        let href = cap[2]
        let title = cap[3] ? cap[3].slice(1, -1) : ''
        href = href.trim().replace(/^<([\s\S]*)>$/, '$1')
        href = inlineLexerEscapes(href)
        title = inlineLexerEscapes(title)
        title = title ? escape(title) : null

        const result =
          cap[0].charAt(0) !== '!'
            ? ast.link(href, title, inlineTokenizer(cap[1]))
            : ast.image(href, title, escape(cap[1]))
        opts.inLink = false
        return result
      })
      on([rules.reflink, rules.nolink], cap => {
        src = src.substring(cap[0].length)
        const linkTag = (cap[2] || cap[1]).replace(/\s+/g, ' ').toLowerCase()
        const link = links.get(linkTag)
        if (!link || !link.href) {
          src = cap[0].substring(1) + src
          //TODO what is this?
          return ast.text(cap[0].charAt(0))
        }
        opts.inLink = true
        const href = link.href
        const title = link.title ? escape(link.title) : null

        const result =
          cap[0].charAt(0) !== '!'
            ? ast.link(href, title, inlineTokenizer(cap[1]))
            : ast.image(href, title, escape(cap[1]))
        opts.inLink = false
        return result
      })
      on(rules.strong, cap => {
        src = src.substring(cap[0].length)
        return ast.strong(inlineTokenizer(cap[4] || cap[3] || cap[2] || cap[1]))
      })
      on(rules.em, cap => {
        src = src.substring(cap[0].length)
        return ast.em(
          inlineTokenizer(
            cap[6] || cap[5] || cap[4] || cap[3] || cap[2] || cap[1]
          )
        )
      })
      on(rules.code, cap => {
        src = src.substring(cap[0].length)
        return ast.codespan(escape(cap[2].trim(), true))
      })
      on(rules.br, cap => {
        src = src.substring(cap[0].length)
        return ast.br()
      })
      on(rules.del, cap => {
        src = src.substring(cap[0].length)
        return ast.del(inlineTokenizer(cap[1]))
      })
      // on(rules.autolink, cap => {
      //   let text
      //   let href
      //   src = src.substring(cap[0].length)
      //   if (cap[2] === '@') {
      //     text = escape(mangleLinks(cap[1]))
      //     href = `mailto:${text}`
      //   } else {
      //     text = escape(cap[1])
      //     href = text
      //   }
      //   return ast.link(href, null, text)
      // })
      // if (!opts.inLink)
      //   on(rules.url, cap => {
      //     let text
      //     let href
      //     if (cap[2] === '@') {
      //       text = escape(cap[0])
      //       href = `mailto:${text}`
      //     } else {
      //       // do extended autolink path validation
      //       let prevCapZero
      //       do {
      //         prevCapZero = cap[0]
      //         cap[0] = rules._backpedal.exec(cap[0])[0]
      //       } while (prevCapZero !== cap[0])
      //       text = escape(cap[0])
      //       if (cap[1] === 'www.') {
      //         href = `http://${text}`
      //       } else {
      //         href = text
      //       }
      //     }
      //     src = src.substring(cap[0].length)
      //     return ast.link(href, null, text)
      //   })
      on(rules.text, cap => {
        src = src.substring(cap[0].length)
        const text = opts.inRawBlock ? cap[0] : escape(smartypants(cap[0]))
        return ast.text(text)
      })

      if (!skip) {
        throw new Error(`Infinite loop on byte: ${src.charCodeAt(0)}`)
      }
    }

    return out
  }
}
type HTMLAttrValue = string | number | boolean | null
type HTMLAttr = {
  attr: string
  value: HTMLAttrValue
}
type HTMLNode = {
  type: 'node'
  tag: string
  attr: HTMLAttr[]
  child: Array<HTMLNode | HTMLText>
}
type HTMLText = {
  type: 'text'
  value: string | number | null
}
export function extractText(
  nodes: AstToken[],
  opts: {
    skipNodes?: Array<AstToken['type']>
    keepLineBreaks?: boolean
  } = {}
) {
  const results: string[] = []
  const skipNodes = opts.skipNodes || []
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (skipNodes.includes(node.type)) continue
    if ('value' in node) {
      results.push(node.value)
    } else if ('child' in node) {
      results.push(...extractText(node.child, opts))
    }
    if (opts.keepLineBreaks) {
      switch (node.type) {
        case 'code':
        case 'blockquote':
        case 'br':
        case 'heading':
        case 'hr':
        case 'html':
        case 'image':
        case 'listitem':
        case 'paragraph':
        case 'tablerow':
          results.push(`\n`)
          break
      }
    }
  }
  return results
}

export type AstToken =
  | {type: 'link'; href: string; title: string | null; child: AstToken[]}
  | {type: 'image'; href; title; value: string}
  | {type: 'strong'; child: AstToken[]}
  | {type: 'em'; child: AstToken[]}
  | {type: 'codespan'; value: string}
  | {type: 'br'}
  | {type: 'del'; child: AstToken[]}
  | {type: 'text'; value: string}
  | {type: 'escape'; value: string}
  | {type: 'tag'; value: string}
  | {type: 'hr'}
  | {type: 'heading'; child: AstToken[]; level: number}
  | {type: 'code'; value: string; lang: string | void; escaped: boolean | void}
  | {
      type: 'tablecell'
      child: AstToken[]
      header: boolean
      align: 'left' | 'right' | 'center'
    }
  | {type: 'tablerow'; child: AstToken[]}
  | {type: 'table'; child: AstToken[]; header: AstToken[]}
  | {type: 'blockquote'; child: AstToken[]}
  | {type: 'list'; child: AstToken[]; ordered: true; start: number}
  | {type: 'list'; child: AstToken[]; ordered: false; start: string}
  | {type: 'checkbox'; checked: boolean}
  | {type: 'listitem'; child: AstToken[]; task; checked: boolean | void}
  | {type: 'html'; value: string}
  | {type: 'paragraph'; child: AstToken[]}
  | {type: 'space'}

type Filter<T, U> = T extends U ? T : never
export type ParentAstToken = Filter<AstToken, {child: AstToken[]}>
export type ContentAstToken = Filter<AstToken, {value: string}>

const ast = {
  link: (href: string, title: string | null, child: AstToken[]): AstToken => ({
    type: 'link',
    href,
    title,
    child
  }),
  image: (href, title, value: string): AstToken => ({
    type: 'image',
    href,
    title,
    value
  }),
  strong: (child: AstToken[]): AstToken => ({type: 'strong', child}),
  em: (child: AstToken[]): AstToken => ({type: 'em', child}),
  codespan: (value: string): AstToken => ({type: 'codespan', value}),
  br: (): AstToken => ({type: 'br'}),
  del: (child: AstToken[]): AstToken => ({type: 'del', child}),
  text: (value: string): AstToken => ({type: 'text', value}),
  escape: (value: string): AstToken => ({type: 'escape', value}),
  tag: (value: string): AstToken => ({type: 'tag', value}),
  hr: (): AstToken => ({type: 'hr'}),
  heading: (child: AstToken[], level: number): AstToken => ({
    type: 'heading',
    child,
    level
  }),
  code: (value: string, lang: string | void, escaped): AstToken => ({
    type: 'code',
    value,
    lang,
    escaped
  }),
  tablecell: (
    child: AstToken[],
    {header, align}: {header: boolean; align: 'left' | 'right' | 'center'}
  ): AstToken => ({
    type: 'tablecell',
    child,
    header,
    align
  }),
  tablerow: (child: AstToken[]): AstToken => ({type: 'tablerow', child}),
  table: (header: AstToken[], child: AstToken[]): AstToken => ({
    type: 'table',
    header,
    child
  }),
  blockquote: (child: AstToken[]): AstToken => ({type: 'blockquote', child}),
  list: (
    child: AstToken[],
    ordered: boolean,
    start: string | number
    //@ts-ignore
  ): AstToken => ({
    type: 'list',
    child,
    ordered,
    start
  }),
  checkbox: (checked: boolean): AstToken => ({type: 'checkbox', checked}),
  listitem: (child: AstToken[], task, checked?: boolean): AstToken => ({
    type: 'listitem',
    child,
    task,
    checked
  }),
  html: (value: string): AstToken => ({type: 'html', value}),
  paragraph: (child: AstToken[]): AstToken => ({type: 'paragraph', child}),
  space: (): AstToken => ({type: 'space'})
}

function inlineLexerEscapes(text) {
  return text ? text.replace(inline._escapes, '$1') : text
}

function escape(html: string, encode = false) {
  return html
  if (encode) {
    if (escape.escapeTest.test(html)) {
      return html.replace(escape.escapeReplace, ch => escape.replacements[ch])
    }
  } else {
    return html
    if (escape.escapeTestNoEncode.test(html)) {
      return html.replace(
        escape.escapeReplaceNoEncode,
        ch => escape.replacements[ch]
      )
    }
  }

  return html
}

escape.escapeTest = /[&<>"']/
escape.escapeReplace = /[&<>"']/g
escape.replacements = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}

escape.escapeTestNoEncode = /[<>"']|&(?!#?\w+;)/
escape.escapeReplaceNoEncode = /[<>"']|&(?!#?\w+;)/g

function edit(regexRaw: RegExp | string, flags = '') {
  let regex = typeof regexRaw === 'string' ? regexRaw : regexRaw.source
  const editor = {
    replace(name: string | RegExp, valRaw: string | RegExp) {
      let val = typeof valRaw === 'string' ? valRaw : valRaw.source
      val = val.replace(/(^|[^\[])\^/g, '$1')
      regex = regex.replace(name, val)
      return editor
    },
    getRegex() {
      return new RegExp(regex, flags)
    }
  }
  return editor
}

function noop(str: string): RegExpExecArray | void {}
noop.exec = noop

function splitCells(tableRow: string, count?: number) {
  // ensure that every cell-delimiting pipe has a space
  // before it to distinguish it from an escaped pipe
  const row = tableRow.replace(/\|/g, (match, offset, str) => {
    let escaped = false,
      curr = offset
    while (--curr >= 0 && str[curr] === '\\') escaped = !escaped
    if (escaped) {
      // odd number of slashes means | is escaped
      // so we leave it alone
      return '|'
    } else {
      // add space before unescaped |
      return ' |'
    }
  })

  const cells = row.split(/ \|/)
  let i = 0

  if (cells.length > count) {
    cells.splice(count)
  } else {
    while (cells.length < count) cells.push('')
  }

  for (; i < cells.length; i++) {
    // leading or trailing whitespace is ignored per the gfm spec
    cells[i] = cells[i].trim().replace(/\\\|/g, '|')
  }
  return cells
}

// Remove trailing 'c's. Equivalent to str.replace(/c*$/, '').
// /c*$/ is vulnerable to REDOS.
// invert: Remove suffix of non-c chars instead. Default falsey.
function rtrim(str: string, c, invert = false) {
  if (str.length === 0) {
    return ''
  }

  // Length of suffix matching the invert condition.
  let suffLen = 0

  // Step left until we fail to match the invert condition.
  while (suffLen < str.length) {
    const currChar = str.charAt(str.length - suffLen - 1)
    if (currChar === c && !invert) {
      suffLen++
    } else if (currChar !== c && invert) {
      suffLen++
    } else {
      break
    }
  }

  return str.substr(0, str.length - suffLen)
}

function findClosingBracket(str, b) {
  if (!str.includes(b[1])) {
    return -1
  }
  let level = 0
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\\') {
      i++
    } else if (str[i] === b[0]) {
      level++
    } else if (str[i] === b[1]) {
      level--
      if (level < 0) {
        return i
      }
    }
  }
  return -1
}
