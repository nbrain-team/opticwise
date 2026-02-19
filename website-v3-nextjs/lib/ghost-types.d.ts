declare module "@tryghost/content-api" {
  interface GhostContentAPIOptions {
    url: string;
    key: string;
    version: string;
  }

  interface BrowseParams {
    limit?: string | number;
    page?: number;
    include?: string[];
    fields?: string;
    filter?: string;
    order?: string;
  }

  interface ReadParams {
    id?: string;
    slug?: string;
  }

  interface Resource {
    browse(params?: BrowseParams): Promise<any[]>;
    read(data: ReadParams, params?: BrowseParams): Promise<any>;
  }

  class GhostContentAPI {
    constructor(options: GhostContentAPIOptions);
    posts: Resource;
    pages: Resource;
    tags: Resource;
    authors: Resource;
    settings: { browse(): Promise<any> };
  }

  export default GhostContentAPI;
}
