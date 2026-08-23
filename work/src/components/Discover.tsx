import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, ListFilter as Filter, Loader as Loader2, Music2, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ActiveFilters, DbEvent, FilterLogic } from '@/types/event';

type DiscoverProps = {
  onOpenEvent?: (event: DbEvent) => void;
};

const emptyFilters: ActiveFilters = { category: [], artist: [], genre: [] };

function formatDateLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Discover({ onOpenEvent }: DiscoverProps) {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Date browse
  const [selectedDate, setSelectedDate] = useState('');

  // Filter panel
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState<ActiveFilters>(emptyFilters);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(emptyFilters);
  const [logic, setLogic] = useState<FilterLogic>('AND');

  // Advanced mode
  const [advanced, setAdvanced] = useState(false);

  // Available options
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allArtists, setAllArtists] = useState<string[]>([]);
  const [allGenres, setAllGenres] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('category, artist, genre');
      if (cancelled || fetchError || !data) return;
      setAllCategories([...new Set(data.map((r) => r.category).filter(Boolean))] as string[]);
      setAllArtists([...new Set(data.map((r) => r.artist).filter(Boolean))] as string[]);
      setAllGenres([...new Set(data.map((r) => r.genre).filter(Boolean))] as string[]);
    })();
    return () => { cancelled = true; };
  }, []);

  const hasActiveFilters =
    activeFilters.category.length > 0 ||
    activeFilters.artist.length > 0 ||
    activeFilters.genre.length > 0;

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('events').select('*');

      if (selectedDate) {
        query = query.eq('event_date', selectedDate);
      }

      if (hasActiveFilters) {
        const groups: string[][] = [];
        if (activeFilters.category.length) groups.push(activeFilters.category);
        if (activeFilters.artist.length) groups.push(activeFilters.artist);
        if (activeFilters.genre.length) groups.push(activeFilters.genre);

        if (logic === 'AND') {
          if (activeFilters.category.length) query = query.in('category', activeFilters.category);
          if (activeFilters.artist.length) query = query.in('artist', activeFilters.artist);
          if (activeFilters.genre.length) query = query.in('genre', activeFilters.genre);
        } else {
          // OR: combine all values across groups into one OR clause
          const allValues = groups.flat();
          if (allValues.length) {
            const conds: string[] = [];
            if (activeFilters.category.length) {
              activeFilters.category.forEach((v) => conds.push(`category.eq.${v}`));
            }
            if (activeFilters.artist.length) {
              activeFilters.artist.forEach((v) => conds.push(`artist.eq.${v}`));
            }
            if (activeFilters.genre.length) {
              activeFilters.genre.forEach((v) => conds.push(`genre.eq.${v}`));
            }
            query = query.or(conds.join(','));
          }
        }
      }

      query = query.order('event_date').order('event_time');

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setEvents((data ?? []) as DbEvent[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events.');
      setEvents([]);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  }, [selectedDate, activeFilters, logic, hasActiveFilters]);

  useEffect(() => {
    if (hasSearched) fetchEvents();
  }, [hasSearched, selectedDate, activeFilters, logic, fetchEvents]);

  const applyFilters = () => {
    setActiveFilters(filterDraft);
    setFilterOpen(false);
    setHasSearched(true);
  };

  const clearFilters = () => {
    setFilterDraft(emptyFilters);
    setActiveFilters(emptyFilters);
    setFilterOpen(false);
    setHasSearched(true);
  };

  const clearDate = () => {
    setSelectedDate('');
    setHasSearched(true);
  };

  const toggleDraftValue = (group: keyof ActiveFilters, value: string) => {
    setFilterDraft((prev) => {
      const list = prev[group];
      return {
        ...prev,
        [group]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });
  };

  const draftCount =
    filterDraft.category.length + filterDraft.artist.length + filterDraft.genre.length;
  const activeCount =
    activeFilters.category.length + activeFilters.artist.length + activeFilters.genre.length;

  const categoryColors = useMemo(() => {
    const map: Record<string, string> = {};
    const palette = ['#ff335f', '#378bff', '#9c45ff', '#e34dff', '#ff8a3d', '#3dd6a0', '#ffd23d', '#3dceff'];
    allCategories.forEach((c, i) => { map[c] = palette[i % palette.length]; });
    return map;
  }, [allCategories]);

  return (
    <section className="discover-section" id="discover">
      <div className="section-heading">
        <div>
          <div className="section-kicker"><span /> Discover & filter</div>
          <h2>Find your event</h2>
        </div>
      </div>

      {/* Advanced mode toggle */}
      <div className="advanced-toggle-row">
        <span className="advanced-label">
          <Sparkles size={15} /> Advanced Mode
          <span className="advanced-hint">Combine date + filters</span>
        </span>
        <button
          type="button"
          className={`advanced-toggle ${advanced ? 'on' : ''}`}
          role="switch"
          aria-checked={advanced}
          aria-label="Toggle advanced mode"
          onClick={() => {
            setAdvanced((a) => !a);
            setHasSearched(true);
          }}
        >
          <span className="toggle-knob" />
        </button>
        {advanced && <span className="advanced-badge">Advanced active</span>}
      </div>

      {/* Controls */}
      <div className="discover-controls">
        <div className="date-picker-wrap">
          <CalendarDays size={16} />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setHasSearched(true);
            }}
            className="date-input"
            aria-label="Browse events by date"
          />
          {selectedDate && (
            <button type="button" className="clear-date" onClick={clearDate} aria-label="Clear date">
              <X size={14} />
            </button>
          )}
        </div>

        <button
          type="button"
          className={`filter-button ${activeCount > 0 ? 'has-filters' : ''}`}
          onClick={() => { setFilterDraft(activeFilters); setFilterOpen((o) => !o); }}
        >
          <Filter size={17} /> Filters
          {activeCount > 0 && <span className="filter-count">{activeCount}</span>}
        </button>

        {!advanced && (
          <button type="button" className="discover-search-btn" onClick={() => setHasSearched(true)}>
            <Search size={16} /> Search
          </button>
        )}

        {(hasActiveFilters || selectedDate) && (
          <button type="button" className="clear-all" onClick={() => { clearFilters(); clearDate(); }}>
            <X size={14} /> Clear all
          </button>
        )}
      </div>

      {/* Filter panel */}
      {filterOpen && (
        <div className="filter-panel">
          <div className="filter-panel-header">
            <h3><SlidersHorizontal size={16} /> Filter events</h3>
            <button type="button" className="filter-close" onClick={() => setFilterOpen(false)} aria-label="Close filters"><X size={18} /></button>
          </div>

          <div className="logic-toggle-row">
            <span className="logic-label">Match</span>
            <div className="logic-tabs">
              <button type="button" className={logic === 'AND' ? 'active' : ''} onClick={() => setLogic('AND')}>AND (all)</button>
              <button type="button" className={logic === 'OR' ? 'active' : ''} onClick={() => setLogic('OR')}>OR (any)</button>
            </div>
          </div>

          <FilterGroup
            title="Category"
            options={allCategories}
            selected={filterDraft.category}
            onToggle={(v) => toggleDraftValue('category', v)}
            colors={categoryColors}
          />
          <FilterGroup
            title="Singer / Artist"
            options={allArtists}
            selected={filterDraft.artist}
            onToggle={(v) => toggleDraftValue('artist', v)}
          />
          <FilterGroup
            title="Genre"
            options={allGenres}
            selected={filterDraft.genre}
            onToggle={(v) => toggleDraftValue('genre', v)}
          />

          <div className="filter-panel-actions">
            <button type="button" className="btn-secondary" onClick={clearFilters}>Clear filters</button>
            <button type="button" className="primary-button" onClick={applyFilters}>
              Apply {draftCount > 0 ? `${draftCount} filter${draftCount > 1 ? 's' : ''}` : ''}
            </button>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {(activeCount > 0 || selectedDate) && (
        <div className="active-chips">
          {selectedDate && (
            <span className="chip chip-date">
              <CalendarDays size={12} /> {formatDateLabel(selectedDate)}
              <button type="button" onClick={clearDate} aria-label="Remove date"><X size={12} /></button>
            </span>
          )}
          {activeFilters.category.map((v) => (
            <Chip key={`c-${v}`} label={v} color={categoryColors[v]} onRemove={() => {
              const next = { ...activeFilters, category: activeFilters.category.filter((x) => x !== v) };
              setActiveFilters(next);
              setHasSearched(true);
            }} />
          ))}
          {activeFilters.artist.map((v) => (
            <Chip key={`a-${v}`} label={v} onRemove={() => {
              const next = { ...activeFilters, artist: activeFilters.artist.filter((x) => x !== v) };
              setActiveFilters(next);
              setHasSearched(true);
            }} />
          ))}
          {activeFilters.genre.map((v) => (
            <Chip key={`g-${v}`} label={v} onRemove={() => {
              const next = { ...activeFilters, genre: activeFilters.genre.filter((x) => x !== v) };
              setActiveFilters(next);
              setHasSearched(true);
            }} />
          ))}
        </div>
      )}

      {/* Results */}
      <div className="discover-results">
        {loading && (
          <div className="discover-loading">
            <Loader2 size={26} className="spin" />
            <span>Loading events…</span>
          </div>
        )}

        {error && (
          <div className="discover-error">
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button type="button" className="btn-secondary" onClick={fetchEvents}>Try again</button>
          </div>
        )}

        {!loading && !error && hasSearched && events.length === 0 && (
          <div className="empty-state">
            <Search size={22} />
            <h3>No events found{selectedDate ? ' for this date' : ''}</h3>
            <p>{selectedDate ? `There are no events on ${formatDateLabel(selectedDate)}.` : 'Try adjusting your filters or date.'}</p>
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <>
            <div className="results-count">{events.length} event{events.length > 1 ? 's' : ''} found</div>
            <div className="discover-list">
              {events.map((event, index) => (
                <article
                  className="discover-card"
                  key={event.id}
                  style={{ '--card-delay': `${index * 0.06}s` } as React.CSSProperties}
                  onClick={() => onOpenEvent?.(event)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') onOpenEvent?.(event); }}
                >
                  <div className="discover-card-visual" style={{ '--accent': categoryColors[event.category] ?? '#9c45ff' } as React.CSSProperties}>
                    <Music2 size={20} />
                  </div>
                  <div className="discover-card-content">
                    <div className="discover-card-top">
                      <span className="discover-category" style={{ color: categoryColors[event.category] ?? '#9c45ff' }}>
                        {event.category}
                      </span>
                      <span className="discover-date"><CalendarDays size={12} /> {formatDateLabel(event.event_date)}</span>
                    </div>
                    <h3>{event.title}</h3>
                    {event.description && <p>{event.description}</p>}
                    <div className="discover-meta">
                      {event.artist && <span><strong>Artist</strong>{event.artist}</span>}
                      {event.genre && <span><strong>Genre</strong>{event.genre}</span>}
                      {event.city && <span><strong>City</strong>{event.city}</span>}
                      {event.venue && <span><strong>Venue</strong>{event.venue}</span>}
                      {event.event_time && <span><strong>Time</strong>{event.event_time}</span>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {!loading && !error && !hasSearched && (
          <div className="discover-hint">
            <ChevronDown size={20} />
            <p>Pick a date or apply filters to discover events.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
  colors,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  colors?: Record<string, string>;
}) {
  if (options.length === 0) return null;
  return (
    <div className="filter-group">
      <h4>{title}</h4>
      <div className="filter-chips">
        {options.map((opt) => {
          const isOn = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              className={`filter-chip ${isOn ? 'on' : ''}`}
              style={isOn && colors?.[opt] ? { '--chip-color': colors[opt] } as React.CSSProperties : undefined}
              onClick={() => onToggle(opt)}
            >
              {colors?.[opt] && <span className="chip-dot" style={{ background: colors[opt] }} />}
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Chip({ label, color, onRemove }: { label: string; color?: string; onRemove: () => void }) {
  return (
    <span className="chip" style={color ? { '--chip-color': color } as React.CSSProperties : undefined}>
      {color && <span className="chip-dot" style={{ background: color }} />}
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove ${label}`}><X size={12} /></button>
    </span>
  );
}
