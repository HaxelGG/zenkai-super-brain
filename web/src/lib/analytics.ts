// Analytics helper para Vercel Web Analytics
// Los eventos se trackean via window.va('event', {...})

type EventName = 'lead_captured' | 'plan_viewed' | 'roi_calculated' | 'chat_opened' | 'simulator_used' | 'whatsapp_click';

export function track(name: EventName, props?: Record<string, string>) {
  try {
    const w = window as any;
    if (w.va) {
      w.va('event', { name, ...props });
    }
  } catch {}
}

export function trackLead(source: string) {
  track('lead_captured', { source });
}

export function trackPlanView() {
  track('plan_viewed');
}

export function trackROI() {
  track('roi_calculated');
}

export function trackChat() {
  track('chat_opened');
}

export function trackSimulator() {
  track('simulator_used');
}

export function trackWhatsApp(location: string) {
  track('whatsapp_click', { location });
}
