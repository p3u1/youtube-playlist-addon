// index.js
const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const ytdl = require("ytdl-core");          // <- new line
const playlist = require("./playlist");

const manifest = {
  id: "com.paul.youtube.playlist",
  version: "1.0.0",
  name: "YouTube Playlist",
  description: "Paul's YouTube Playlist as a Stremio catalog.",
  logo: "",
  background: "",
  types: ["movie"],
  resources: ["catalog", "meta", "stream"],
  catalogs: [
    {
      type: "movie",
      id: "paul-youtube-playlist",
      name: "YouTube Playlist"
    }
  ]
};

const builder = new addonBuilder(manifest);

// Catalog: list all items
builder.defineCatalogHandler(args => {
  if (args.type !== "movie" || args.id !== "paul-youtube-playlist") {
    return Promise.resolve({ metas: [] });
  }

  const metas = playlist.map(item => ({
    id: item.id,
    type: "movie",
    name: item.name,
    poster: null,
    posterShape: "landscape"
  }));

  return Promise.resolve({ metas });
});

// Meta: details about one item
builder.defineMetaHandler(args => {
  const item = playlist.find(v => v.id === args.id);
  if (!item) return Promise.resolve({ meta: {} });

  return Promise.resolve({
    meta: {
      id: item.id,
      type: "movie",
      name: item.name,
      poster: null,
      posterShape: "landscape"
    }
  });
});

// Stream: resolve YouTube URL to a direct video stream
builder.defineStreamHandler(async args => {
  const item = playlist.find(v => v.id === args.id);
  if (!item) return { streams: [] };

  try {
    const info = await ytdl.getInfo(item.url);

    const format = ytdl.chooseFormat(info.formats, {
      quality: "highest",
      filter: f => f.hasAudio && f.hasVideo
    });

    if (!format || !format.url) {
      console.error("No playable format for", item.url);
      return { streams: [] };
    }

    return {
      streams: [
        {
          title: "YouTube",
          url: format.url
        }
      ]
    };
  } catch (err) {
    console.error("Error resolving YouTube URL", item.url, err);
    return { streams: [] };
  }
});

// Start HTTP server
const port = process.env.PORT || 7000;
serveHTTP(builder.getInterface(), { port });
console.log(`YouTube Playlist addon running on port ${port}`);
console.log(`Manifest URL: http://localhost:${port}/manifest.json`);
