import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';

export interface PixiSceneController {
  destroy: () => void;
  resize: (width: number, height: number) => void;
}

export type SceneFactory = (app: Application) => Promise<PixiSceneController>;

interface Props {
  scene: SceneFactory;
  className?: string;
}

/**
 * Mounts a PixiJS Application onto a div. The scene factory is called once
 * after init; it returns a controller for cleanup + resize.
 *
 * Pixi v8 uses async `init()`, so we keep a ready flag to avoid calling
 * stage operations before the renderer is alive.
 */
export default function PixiCanvas({ scene, className }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;

    const app = new Application();
    let controller: PixiSceneController | null = null;
    let ro: ResizeObserver | null = null;

    (async () => {
      await app.init({
        background: '#fff6e0',
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
        resizeTo: host,
      });
      if (cancelled) {
        app.destroy(true, { children: true, texture: true });
        return;
      }
      host.appendChild(app.canvas);

      controller = await scene(app);

      ro = new ResizeObserver(() => {
        if (!controller) return;
        controller.resize(host.clientWidth, host.clientHeight);
      });
      ro.observe(host);
    })();

    return () => {
      cancelled = true;
      ro?.disconnect();
      controller?.destroy();
      app.destroy(true, { children: true, texture: true });
    };
  }, [scene]);

  return <div ref={hostRef} className={className} style={{ width: '100%', height: '100%' }} />;
}
