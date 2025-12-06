// Mock implementation of maplibre-gl for testing
export class Map {
    private _container: HTMLElement | null = null;
    private _sources: Record<string, any> = {};
    private _layers: Record<string, any> = {};
    private _listeners: Record<string, Function[]> = {};

    constructor(options: any) {
        this._container = options.container;
    }

    addSource(id: string, source: any) {
        this._sources[id] = source;
    }

    getSource(id: string) {
        const source = this._sources[id];
        if (!source) return undefined;

        return {
            setData: (data: any) => {
                this._sources[id].data = data;
            }
        };
    }

    addLayer(layer: any) {
        this._layers[layer.id] = layer;
    }

    getLayer(id: string) {
        return this._layers[id];
    }

    addControl() {
        return this;
    }

    on(event: string, layerId: string | Function, handler?: Function) {
        const eventName = typeof layerId === 'string' ? `${event}-${layerId}` : event;
        const callback = typeof layerId === 'function' ? layerId : handler;

        if (!this._listeners[eventName]) {
            this._listeners[eventName] = [];
        }
        if (callback) {
            this._listeners[eventName].push(callback);
        }
    }

    off(event: string, layerId: string | Function, handler?: Function) {
        const eventName = typeof layerId === 'string' ? `${event}-${layerId}` : event;
        const callback = typeof layerId === 'function' ? layerId : handler;

        if (this._listeners[eventName] && callback) {
            this._listeners[eventName] = this._listeners[eventName].filter(fn => fn !== callback);
        }
    }

    fitBounds() {
        return this;
    }

    isStyleLoaded() {
        return true;
    }

    getCanvas() {
        return {
            style: {
                cursor: ''
            }
        };
    }
}

export class NavigationControl { }

export class Popup {
    constructor(options?: any) { }

    setLngLat(lngLat: any) {
        return this;
    }

    setHTML(html: string) {
        return this;
    }

    addTo(map: any) {
        return this;
    }

    remove() {
        return this;
    }
}

export class LngLatBounds {
    constructor(sw?: any, ne?: any) { }

    extend(coord: any) {
        return this;
    }
}

export default {
    Map,
    NavigationControl,
    Popup,
    LngLatBounds
};
