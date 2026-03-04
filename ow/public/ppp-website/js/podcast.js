(function () {
  const RSS_URL = 'https://anchor.fm/s/1057cecf4/podcast/rss';
  var PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?url=',
    'https://api.codetabs.com/v1/proxy?quest='
  ];
  const MAX_EPISODES = 60;

  const container = document.getElementById('episodesContainer');
  if (!container) return;

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function excerpt(text, max) {
    max = max || 180;
    if (!text) return '';
    const stripped = text.replace(/<[^>]+>/g, '').trim();
    if (stripped.length <= max) return stripped;
    return stripped.slice(0, max).trimEnd() + '\u2026';
  }

  function getText(el, tag) {
    var child = el.getElementsByTagName(tag)[0];
    return child ? child.textContent || '' : '';
  }

  function getAttr(el, ns, tag, attr) {
    var children = el.getElementsByTagNameNS(ns, tag);
    if (children.length > 0) return children[0].getAttribute(attr) || '';
    return '';
  }

  function renderEpisodes(episodes) {
    if (!episodes.length) {
      container.innerHTML = '<div class="dark-panel" style="text-align:center;color:var(--text-muted);">No episodes found. Check the RSS feed URL.</div>';
      return;
    }

    var html = '<div class="episodes-grid">';
    episodes.forEach(function (ep) {
      var date = formatDate(ep.pubDate);
      var desc = excerpt(ep.description);

      html += '<div class="episode-card">';

      html += '<div class="episode-thumb">';
      if (ep.image) {
        html += '<img src="' + ep.image + '" alt="" loading="lazy">';
      }
      html += '</div>';

      html += '<div style="min-width:0;flex:1;">';

      html += '<div class="episode-meta">';
      if (date) html += '<span>' + date + '</span>';
      if (ep.duration) html += '<span class="episode-duration">' + ep.duration + '</span>';
      html += '</div>';

      html += '<div class="episode-title">' + (ep.title || 'Untitled') + '</div>';
      if (desc) html += '<div class="episode-desc">' + desc + '</div>';

      if (ep.link) {
        html += '<div class="episode-listen"><a href="' + ep.link + '" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">Listen &rarr;</a></div>';
      }

      html += '</div></div>';
    });
    html += '</div>';

    container.innerHTML = html;
  }

  function parseRss(xml) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(xml, 'application/xml');
    var items = doc.querySelectorAll('item');
    var episodes = [];
    var itunesNS = 'http://www.itunes.com/dtds/podcast-1.0.dtd';

    items.forEach(function (item, i) {
      if (i >= MAX_EPISODES) return;

      var image = getAttr(item, itunesNS, 'image', 'href');
      var duration = getText(item, 'itunes:duration') || getAttr(item, itunesNS, 'duration', '');
      var enclosure = item.getElementsByTagName('enclosure')[0];
      var audioUrl = enclosure ? enclosure.getAttribute('url') : '';

      episodes.push({
        title: getText(item, 'title'),
        pubDate: getText(item, 'pubDate'),
        description: getText(item, 'description'),
        link: getText(item, 'link') || audioUrl,
        guid: getText(item, 'guid'),
        duration: duration,
        image: image
      });
    });

    return episodes;
  }

  function tryProxy(index) {
    if (index >= PROXIES.length) {
      container.innerHTML = '<div class="dark-panel" style="text-align:center;"><p style="color:var(--text-muted);">Unable to load episodes right now.</p><p style="font-size:0.8125rem;color:var(--text-muted);margin-top:0.5rem;">You can listen directly on <a href="https://open.spotify.com/show/3TLMly7c1TNWeMUyZDVyhQ" target="_blank" rel="noopener noreferrer">Spotify</a>, <a href="https://podcasts.apple.com/us/podcast/peak-property-performance/id1817250978" target="_blank" rel="noopener noreferrer">Apple Podcasts</a>, or <a href="https://www.youtube.com/@PeakPropertyPerformance" target="_blank" rel="noopener noreferrer">YouTube</a>.</p></div>';
      return;
    }

    var url = PROXIES[index] + encodeURIComponent(RSS_URL);

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Proxy ' + index + ' failed: ' + res.status);
        return res.text();
      })
      .then(function (xml) {
        var episodes = parseRss(xml);
        if (episodes.length === 0) throw new Error('No episodes parsed');
        renderEpisodes(episodes);
      })
      .catch(function (err) {
        console.warn('Proxy ' + index + ' error:', err.message);
        tryProxy(index + 1);
      });
  }

  tryProxy(0);
})();
