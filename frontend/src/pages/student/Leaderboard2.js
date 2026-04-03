import React, { useEffect, useState } from 'react';
import { getOverallLeaderboard } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StudentLayout from '../../components/StudentLayout';

const LIST_PAGE_SIZE = 2;

/* ── Coloured initials avatar ── */
function Avatar({ name, size = 52, fontSize = 18 }) {
  const palette = ['#e91e8c','#9c27b0','#3f51b5','#0288d1','#00897b','#43a047','#fb8c00','#e53935'];
  const bg = name ? palette[name.charCodeAt(0) % palette.length] : '#9c27b0';
  const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 800, fontSize, flexShrink: 0, userSelect: 'none',
      boxShadow: '0 2px 8px rgba(0,0,0,0.18)'
    }}>{initials}</div>
  );
}

/* ── Arrow button ── */
function ArrowBtn({ direction, disabled, onClick }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 40, height: 40, borderRadius: '50%', border: 'none', flexShrink: 0,
      background: disabled ? '#e5e7eb' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
      color: disabled ? '#b0b7c3' : '#fff',
      cursor: disabled ? 'default' : 'pointer',
      fontSize: 22, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: disabled ? 'none' : '0 3px 10px rgba(124,58,237,0.40)',
      transition: 'opacity .2s'
    }}>{direction === 'left' ? '‹' : '›'}</button>
  );
}

export default function GeneralLeaderboard() {
  const { user } = useAuth();
  const [rankings, setRankings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [listPage, setListPage]   = useState(0);

  const [department, setDepartment] = useState('');

  useEffect(() => {
    getOverallLeaderboard()
      .then(r => {
        setRankings(r.data.rankings);
        setDepartment(r.data.department || '');
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#7c3aed', fontWeight: 600 }}>Loading leaderboard…</div>;

  const top3   = rankings.slice(0, 3);
  const totalP = Math.ceil(rankings.length / LIST_PAGE_SIZE);
  const slice  = rankings.slice(listPage * LIST_PAGE_SIZE, (listPage + 1) * LIST_PAGE_SIZE);
  // always keep 2 slots so the grid doesn't collapse
  const listItems = slice.length < 2 ? [...slice, ...Array(2 - slice.length).fill(null)] : slice;

  /* podium visual config: [2nd-place, 1st-place, 3rd-place] */
  const podium = [
    { item: top3[1], rank: 2, barH: 90,  avSize: 62, ring: 'rgba(255,255,255,0.45)' },
    { item: top3[0], rank: 1, barH: 128, avSize: 78, ring: '#fbbf24' },
    { item: top3[2], rank: 3, barH: 66,  avSize: 54, ring: 'rgba(255,255,255,0.35)' },
  ];

  return (
    <StudentLayout pageTitle="Leaderboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>

        {/* ════════════════════════════════
            HERO / PODIUM CARD
        ════════════════════════════════ */}
        <div style={{
          borderRadius: 24,
          background: 'linear-gradient(145deg, #3b1d8a 0%, #6d28d9 42%, #7c3aed 70%, #4c1d95 100%)',
          padding: '0 32px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(109,40,217,0.35)'
        }}>

          {/* ── Decorative blobs ── */}
          <div style={{ position:'absolute', top:-30,  left:-30,  width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
          <div style={{ position:'absolute', top:20,   left:110,  width:60,  height:60,  borderRadius:'50%', background:'rgba(255,255,255,0.07)' }} />
          <div style={{ position:'absolute', top:-10,  right:60,  width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
          <div style={{ position:'absolute', bottom:30,right:20,  width:70,  height:70,  borderRadius:'50%', background:'rgba(255,255,255,0.07)' }} />
          <div style={{ position:'absolute', bottom:10,left:60,   width:44,  height:44,  borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
          <div style={{ position:'absolute', top:60,   right:160, width:28,  height:28,  borderRadius:'50%', background:'rgba(255,255,255,0.10)' }} />

          {/* ── Title ── */}
          <div style={{ textAlign:'center', paddingTop: 24, position:'relative', zIndex:1 }}>
            <h1 style={{
              margin: '0 0 0',
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: 5,
              color: '#fff',
              textTransform: 'uppercase',
              textShadow: '0 2px 12px rgba(0,0,0,0.25)'
            }}>Leader Board</h1>
            {department && (
              <div style={{
                display: 'inline-block',
                marginTop: 8,
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(6px)',
                borderRadius: 20,
                padding: '4px 16px',
                fontSize: 12,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.90)',
                letterSpacing: 1,
                textTransform: 'uppercase'
              }}>
                {department} Department
              </div>
            )}
          </div>

          {/* ── Podium ── */}
          {rankings.length === 0 ? (
            <div style={{ textAlign:'center', color:'rgba(255,255,255,0.7)', padding:'40px 0', fontSize:14 }}>
              No quiz attempts yet.
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: 16,
              marginTop: 20,
              position: 'relative',
              zIndex: 1
            }}>
              {podium.map(({ item, rank, barH, avSize, ring }, i) => {
                if (!item) return <div key={i} style={{ width: 140 }} />;
                const isFirst = rank === 1;
                const isMe    = item.student?._id === user?._id;
                return (
                  <div key={item.student?._id} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    width: 140
                  }}>
                    {/* Crown */}
                    {isFirst && <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 4 }}>👑</div>}
                    {!isFirst && <div style={{ height: 36 }} />}

                    {/* Ring + Avatar */}
                    <div style={{
                      width: avSize + 8, height: avSize + 8, borderRadius: '50%',
                      border: `3px solid ${ring}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: isFirst ? '0 0 20px rgba(251,191,36,0.55)' : 'none'
                    }}>
                      <Avatar name={item.student?.name} size={avSize} fontSize={isFirst ? 24 : 18} />
                    </div>

                    {/* Rank number */}
                    <div style={{
                      fontSize: isFirst ? 36 : 26, fontWeight: 900, lineHeight: 1,
                      color: isFirst ? '#fbbf24' : '#e0d7ff',
                      marginTop: 8,
                      textShadow: isFirst ? '0 0 16px rgba(251,191,36,0.7)' : 'none'
                    }}>{rank}</div>

                    {/* Name */}
                    <div style={{
                      fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.90)',
                      textAlign: 'center', marginTop: 3,
                      maxWidth: 130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'
                    }}>
                      {item.student?.name}
                      {isMe && <span style={{ color:'#fbbf24' }}> ★</span>}
                    </div>

                    {/* Score pill */}
                    <div style={{
                      marginTop: 5, marginBottom: 10,
                      background: 'rgba(255,255,255,0.15)',
                      borderRadius: 20, padding: '3px 12px',
                      fontSize: 11, fontWeight: 700,
                      color: isFirst ? '#fef3c7' : 'rgba(255,255,255,0.75)',
                      backdropFilter: 'blur(4px)'
                    }}>
                      Score {item.averageScore}%
                    </div>

                    {/* Podium bar */}
                    <div style={{
                      width: '100%', height: barH,
                      borderRadius: '12px 12px 0 0',
                      background: isFirst
                        ? 'linear-gradient(180deg,rgba(255,255,255,0.30) 0%,rgba(255,255,255,0.10) 100%)'
                        : 'linear-gradient(180deg,rgba(255,255,255,0.16) 0%,rgba(255,255,255,0.05) 100%)',
                      border: `1px solid ${isFirst ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.15)'}`,
                      borderBottom: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: 22, opacity: 0.5 }}>
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ════════════════════════════════
            RANKED LIST
        ════════════════════════════════ */}
        {rankings.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

            {/* header row */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingInline: 4 }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#374151' }}>
                {department ? `${department} Rankings` : 'All Rankings'}
              </span>
              {totalP > 1 && (
                <span style={{ fontSize:12, color:'#9ca3af' }}>
                  Page {listPage + 1} of {totalP}
                </span>
              )}
            </div>

            {/* cards + arrows */}
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <ArrowBtn direction="left"  disabled={listPage === 0}           onClick={() => setListPage(p => p - 1)} />

              <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {listItems.map((item, i) => {
                  if (!item) return <div key={`pad-${i}`} />;
                  const rank   = listPage * LIST_PAGE_SIZE + i + 1;
                  const isMe   = item.student?._id === user?._id;
                  const pink   = i % 2 === 0;

                  return (
                    <div key={item.student?._id} style={{
                      display:'flex', alignItems:'center', gap:12,
                      background: pink ? '#fdf2f8' : '#f5f3ff',
                      borderRadius: 16,
                      padding: '14px 16px',
                      border: isMe
                        ? '2px solid #7c3aed'
                        : `2px solid ${pink ? '#fbcfe8' : '#ddd6fe'}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      transition: 'transform .15s',
                    }}>
                      {/* Rank pill */}
                      <div style={{
                        minWidth: 40, height: 32,
                        borderRadius: 10,
                        background: pink
                          ? 'linear-gradient(135deg,#ec4899,#db2777)'
                          : 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
                        color: '#fff', fontWeight: 800, fontSize: 13,
                        display:'flex', alignItems:'center', justifyContent:'center', gap: 3,
                        boxShadow: pink ? '0 2px 6px rgba(219,39,119,.35)' : '0 2px 6px rgba(124,58,237,.35)'
                      }}>
                        <span style={{ fontSize:10 }}>▲</span>{rank}
                      </div>

                      <Avatar name={item.student?.name} size={42} fontSize={15} />

                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{
                          fontSize:13, fontWeight:700, color:'#1f2937',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'
                        }}>
                          {item.student?.name}
                        </div>
                        <div style={{ fontSize:11, color: pink ? '#db2777' : '#7c3aed', fontWeight:600, marginTop:1 }}>
                          {item.quizzesTaken} quiz{item.quizzesTaken !== 1 ? 'zes' : ''}
                          {isMe && <span style={{ marginLeft:6, color:'#7c3aed' }}>★ You</span>}
                        </div>
                      </div>

                      {/* Score badge */}
                      <div style={{
                        flexShrink:0, textAlign:'center',
                        background: pink ? '#fce7f3' : '#ede9fe',
                        borderRadius:12, padding:'6px 10px'
                      }}>
                        <div style={{ fontSize:16, fontWeight:900, color: pink ? '#be185d' : '#5b21b6', lineHeight:1 }}>
                          {item.averageScore}
                        </div>
                        <div style={{ fontSize:9, color:'#9ca3af', fontWeight:600, marginTop:2 }}>AVG %</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <ArrowBtn direction="right" disabled={listPage >= totalP - 1} onClick={() => setListPage(p => p + 1)} />
            </div>
          </div>
        )}

      </div>
    </StudentLayout>
  );
}
