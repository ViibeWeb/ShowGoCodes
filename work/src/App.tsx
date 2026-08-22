import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Menu,
  Music2,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

type EventCategory = 'Rock' | 'Jazz' | 'Electronic' | 'Indie';
type EventVisualType = 'guitar' | 'sax' | 'decks' | 'mic';

type Event = {
  id: string;
  title: string;
  description: string;
  city: string;
  venue: string;
  date: string;
  time: string;
  category: EventCategory;
  accent: string;
  glow: string;
  visual: EventVisualType;
};

const visualStyles: Record<EventCategory, { accent: string; glow: string; visual: EventVisualType }> = {
  Rock: { accent: '#ff335f', glow: '#55153a', visual: 'guitar' },
  Jazz: { accent: '#378bff', glow: '#123c87', visual: 'sax' },
  Electronic: { accent: '#9c45ff', glow: '#431082', visual: 'decks' },
  Indie: { accent: '#e34dff', glow: '#651363', visual: 'mic' },
};

const initialEvents: Event[] = [
  {
    id: 'evt-1',
    title: 'Rock Concert',
    description: 'An electrifying night of rock music with epic performances.',
    city: 'New York, NY',
    venue: 'Madison Square Garden',
    date: 'August 25',
    time: '8:00 PM',
    category: 'Rock',
    ...visualStyles.Rock,
  },
  {
    id: 'evt-2',
    title: 'Jazz Night',
    description: 'Join us for a smooth and soulful evening of jazz tunes.',
    city: 'Los Angeles, CA',
    venue: 'The Jazz Lounge',
    date: 'September 10',
    time: '7:30 PM',
    category: 'Jazz',
    ...visualStyles.Jazz,
  },
  {
    id: 'evt-3',
    title: 'Electronic Party',
    description: 'Get ready to dance to the hottest electronic beats in town.',
    city: 'Chicago, IL',
    venue: 'Warehouse 21',
    date: 'September 18',
    time: '10:00 PM',
    category: 'Electronic',
    ...visualStyles.Electronic,
  },
  {
    id: 'evt-4',
    title: 'Indie Showcase',
    description: 'Experience the best indie bands and emerging artists live.',
    city: 'San Francisco, CA',
    venue: 'The Independent',
    date: 'October 2',
    time: '7:00 PM',
    category: 'Indie',
    ...visualStyles.Indie,
  },
];

const categories: Array<'All' | EventCategory> = ['All', 'Rock', 'Jazz', 'Electronic', 'Indie'];

type EmptyFormState = {
  title: string;
  description: string;
  city: string;
  venue: string;
  date: string;
  time: string;
  category: EventCategory;
};

const emptyForm: EmptyFormState = {
  title: '',
  description: '',
  city: '',
  venue: '',
  date: '',
  time: '',
  category: 'Rock',
};

function EventVisual({ event }: { event: Event }) {
  return (
    <div
      className={`event-visual event-visual-${event.visual}`}
      style={{ '--accent': event.accent, '--glow': event.glow } as React.CSSProperties}
      aria-label={`${event.category} event artwork`}
      role="img"
    >
      <div className="visual-grid" />
      <div className="visual-light" />
      {event.visual === 'guitar' && <div className="guitar-shape"><span /></div>}
      {event.visual === 'sax' && <div className="sax-shape"><span /><i /><b /></div>}
      {event.visual === 'decks' && <div className="decks-shape"><span /><i /><b /></div>}
      {event.visual === 'mic' && <div className="mic-shape"><span /><i /></div>}
      <Music2 size={18} className="visual-mark" />
    </div>
  );
}

type View = 'list' | 'details' | 'form';

function App() {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [activeCategory, setActiveCategory] = useState<'All' | EventCategory>('All');
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [joined, setJoined] = useState(false);

  const [view, setView] = useState<View>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<EmptyFormState>(emptyForm);

  const filteredEvents = useMemo(() => events.filter((event) => {
    const matchesCategory = activeCategory === 'All' || event.category === activeCategory;
    const searchText = `${event.title} ${event.city} ${event.venue} ${event.category}`.toLowerCase();
    return matchesCategory && searchText.includes(query.toLowerCase());
  }), [events, activeCategory, query]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedId) ?? null,
    [events, selectedId]
  );

  const scrollToEvents = () => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const openDetails = (id: string) => {
    setSelectedId(id);
    setView('details');
    scrollToTop();
  };

  const openCreateForm = () => {
    setFormMode('create');
    setFormData(emptyForm);
    setView('form');
    scrollToTop();
  };

  const openEditForm = (event: Event) => {
    setFormMode('edit');
    setSelectedId(event.id);
    setFormData({
      title: event.title,
      description: event.description,
      city: event.city,
      venue: event.venue,
      date: event.date,
      time: event.time,
      category: event.category,
    });
    setView('form');
    scrollToTop();
  };

  const closeToList = () => {
    setView('list');
    setSelectedId(null);
  };

  const handleFormChange = (field: keyof EmptyFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();
    const style = visualStyles[formData.category];

    if (formMode === 'create') {
      const newEvent: Event = {
        id: `evt-${Date.now()}`,
        ...formData,
        ...style,
      };
      setEvents((prev) => [newEvent, ...prev]);
      closeToList();
    } else if (formMode === 'edit' && selectedId) {
      setEvents((prev) => prev.map((event) => (
        event.id === selectedId ? { ...event, ...formData, ...style } : event
      )));
      openDetails(selectedId);
    }
  };

  const handleDelete = (id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
    closeToList();
  };

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="site-header">
        <a
          className="brand"
          href="#top"
          aria-label="ShowGo home"
          onClick={(event) => { event.preventDefault(); closeToList(); scrollToTop(); }}
        >
          <span className="brand-icon"><Music2 size={17} strokeWidth={2.5} /></span>
          <span>Show<span>Go</span></span>
        </a>
        <nav className={`desktop-nav ${menuOpen ? 'nav-open' : ''}`} aria-label="Main navigation">
          <a href="#top" onClick={() => { setMenuOpen(false); closeToList(); }}>Home</a>
          <a href="#events" onClick={() => { setMenuOpen(false); closeToList(); }}>Events</a>
          <a href="#about" onClick={() => { setMenuOpen(false); closeToList(); }}>About</a>
        </nav>
        <button className="menu-button" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation">
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </header>

      {view === 'list' && (
        <>
          <section className="hero" id="top">
            <div className="eyebrow"><Sparkles size={14} /> Find your next live moment</div>
            <h1>Discover Music <span>Events</span></h1>
            <p>Find your next unforgettable live music experience.<br className="desktop-break" /> Discover, connect, and vibe together.</p>
            <div className="waveform" aria-label="Animated sound waves">
              {Array.from({ length: 54 }, (_, index) => <span key={index} style={{ '--delay': `${index * -0.05}s`, '--height': `${16 + Math.sin(index * 0.65) * 21 + (index % 5) * 4}px` } as React.CSSProperties} />)}
            </div>
            <button className="primary-button" type="button" onClick={() => { setJoined(true); scrollToEvents(); }}>
              {joined ? 'You’re in — explore events' : 'Join the movement'} <ArrowRight size={17} />
            </button>
          </section>

          <section className="events-section" id="events">
            <div className="section-heading">
              <div>
                <div className="section-kicker"><span /> Live near you</div>
                <h2>Upcoming events</h2>
              </div>
              <button className="date-button" type="button"><CalendarDays size={16} /> Browse dates <ChevronDown size={15} /></button>
            </div>
            <div className="toolbar">
              <div className="category-tabs" aria-label="Filter events by category">
                {categories.map((category) => <button key={category} className={activeCategory === category ? 'active' : ''} type="button" onClick={() => setActiveCategory(category)}>{category}</button>)}
              </div>
              <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events" aria-label="Search events" /></label>
              <button className="filter-button" type="button" aria-label="More filters"><SlidersHorizontal size={17} /></button>
              <button className="create-button" type="button" onClick={openCreateForm}>
                <Plus size={17} /> Create Event
              </button>
            </div>
            <div className="event-list">
              {filteredEvents.length > 0 ? filteredEvents.map((event, index) => (
                <article
                  className="event-card"
                  key={event.id}
                  style={{ '--card-delay': `${index * 0.08}s` } as React.CSSProperties}
                  onClick={() => openDetails(event.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(keyEvent) => { if (keyEvent.key === 'Enter') openDetails(event.id); }}
                >
                  <EventVisual event={event} />
                  <div className="event-content">
                    <div className="event-topline"><span className={`category-dot ${event.category.toLowerCase()}`} /> <span>{event.category}</span></div>
                    <h3>{event.title}</h3>
                    <p>{event.description}</p>
                    <div className="event-details">
                      <span><strong>Location</strong>{event.city}</span>
                      <span><strong>Venue</strong>{event.venue}</span>
                      <span><strong>Date</strong>{event.date}</span>
                      <span><strong>Time</strong>{event.time}</span>
                    </div>
                  </div>
                  <button className="event-arrow" type="button" aria-label={`View ${event.title}`} onClick={(clickEvent) => { clickEvent.stopPropagation(); openDetails(event.id); }}><ArrowRight size={17} /></button>
                </article>
              )) : <div className="empty-state"><Search size={22} /><h3>No events found</h3><p>Try another search or explore every category.</p></div>}
            </div>
          </section>

          <section className="about-strip" id="about">
            <span className="about-icon"><Music2 size={18} /></span>
            <p><strong>Live feels better together.</strong> ShowGo helps you find the soundtracks to your best nights.</p>
            <button type="button" onClick={scrollToEvents}>Explore all shows <ArrowRight size={15} /></button>
          </section>
          <footer><span>© 2024 ShowGo</span><span>Made for the live music people</span></footer>
        </>
      )}

      {view === 'details' && selectedEvent && (
        <section className="detail-page">
          <button className="back-button" type="button" onClick={closeToList}>
            <ArrowLeft size={16} /> Back to events
          </button>
          <div className="detail-card">
            <EventVisual event={selectedEvent} />
            <div className="detail-content">
              <div className="event-topline">
                <span className={`category-dot ${selectedEvent.category.toLowerCase()}`} /> <span>{selectedEvent.category}</span>
              </div>
              <h2>{selectedEvent.title}</h2>
              <p className="detail-description">{selectedEvent.description}</p>
              <div className="detail-grid">
                <div><strong>Location</strong><span>{selectedEvent.city}</span></div>
                <div><strong>Venue</strong><span>{selectedEvent.venue}</span></div>
                <div><strong>Date</strong><span>{selectedEvent.date}</span></div>
                <div><strong>Time</strong><span>{selectedEvent.time}</span></div>
              </div>
              <div className="detail-actions">
                <button className="btn-secondary" type="button" onClick={() => openEditForm(selectedEvent)}>
                  <Pencil size={15} /> Edit event
                </button>
                <button className="btn-danger" type="button" onClick={() => handleDelete(selectedEvent.id)}>
                  <Trash2 size={15} /> Delete event
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {view === 'form' && (
        <section className="form-page">
          <button className="back-button" type="button" onClick={() => (formMode === 'edit' && selectedId ? openDetails(selectedId) : closeToList())}>
            <ArrowLeft size={16} /> {formMode === 'edit' ? 'Back to event' : 'Back to events'}
          </button>
          <form className="event-form" onSubmit={handleFormSubmit}>
            <h2>{formMode === 'create' ? 'Create a new event' : 'Update event'}</h2>
            <p className="form-subtitle">
              {formMode === 'create'
                ? 'Fill in the details below to publish your event.'
                : 'Make changes to your event, or delete it below.'}
            </p>

            <div className="field">
              <label htmlFor="title">Event title</label>
              <input id="title" required value={formData.title} onChange={(event) => handleFormChange('title', event.target.value)} placeholder="e.g. Summer Sound Fest" />
            </div>

            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea id="description" required rows={3} value={formData.description} onChange={(event) => handleFormChange('description', event.target.value)} placeholder="What makes this event special?" />
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="city">City</label>
                <input id="city" required value={formData.city} onChange={(event) => handleFormChange('city', event.target.value)} placeholder="e.g. Austin, TX" />
              </div>
              <div className="field">
                <label htmlFor="venue">Venue</label>
                <input id="venue" required value={formData.venue} onChange={(event) => handleFormChange('venue', event.target.value)} placeholder="e.g. The Moody Theater" />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="date">Date</label>
                <input id="date" required value={formData.date} onChange={(event) => handleFormChange('date', event.target.value)} placeholder="e.g. November 12" />
              </div>
              <div className="field">
                <label htmlFor="time">Time</label>
                <input id="time" required value={formData.time} onChange={(event) => handleFormChange('time', event.target.value)} placeholder="e.g. 8:00 PM" />
              </div>
            </div>

            <div className="field">
              <label htmlFor="category">Category</label>
              <select id="category" value={formData.category} onChange={(event) => handleFormChange('category', event.target.value as EventCategory)}>
                <option value="Rock">Rock</option>
                <option value="Jazz">Jazz</option>
                <option value="Electronic">Electronic</option>
                <option value="Indie">Indie</option>
              </select>
            </div>

            <div className="form-actions">
              {formMode === 'create' ? (
                <button className="primary-button" type="submit">
                  Create event <ArrowRight size={16} />
                </button>
              ) : (
                <>
                  <button className="primary-button" type="submit">
                    Update event
                  </button>
                  <button
                    className="btn-danger"
                    type="button"
                    onClick={() => selectedId && handleDelete(selectedId)}
                  >
                    <Trash2 size={15} /> Delete event
                  </button>
                </>
              )}
            </div>
          </form>
        </section>
      )}
    </main>
  );
}

export default App;
