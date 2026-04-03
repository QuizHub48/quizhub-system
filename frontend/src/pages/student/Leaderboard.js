import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLeaderboard } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StudentLayout from '../../components/StudentLayout';

const LIST_PAGE_SIZE = 2;

/* ── Initials avatar ── */
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
    }}>{direction === 'left' ? '‹' : '›'}</button>
  );
}

export default function Leaderboard() {
  const { quizId } = useParams();
  const { user }   = useAuth();
  const [board, setBoard]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [listPage, setListPage] = useState(0);

  useEffect(() => {
    getLeaderboard(quizId)
      .then(({ data }) => setBoard(data))
      .finally(() => setLoading(false));
  }, [quizId]);

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#7c3aed', fontWeight: 600 }}>
      Loading leaderboard…
    </div>
  );

  const top3   = board.slice(0, 3);
  const totalP = Math.ceil(board.length / LIST_PAGE_SIZE);
  const slice  = board.slice(listPage * LIST_PAGE_SIZE, (listPage + 1) * LIST_PAGE_SIZE);
  const listItems = slice.length < 2 ? [...slice, ...Array(2 - slice.length).fill(null)] : slice;

  /* podium: 2nd left, 1st centre, 3rd right */
  const podium = [
    { item: top3[1], rank: 2, barH: 90,  avSize: 62, ring: 'rgba(255,255,255,0.45)' },
    { item: top3[0], rank: 1, barH: 128, avSize: 78, ring: '#fbbf24' },
    { item: top3[2], rank: 3, barH: 66,  avSize: 54, ring: 'rgba(255,255,255,0.35)' },
  ];

  const quizTitle = board[0]?.quiz?.title || 'This Quiz';

  return (
    <StudentLayout pageTitle="Leaderboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ════ HERO / PODIUM CARD ════ */}
        <div style={{
          borderRadius: 24,
          background: 'linear-gradient(145deg,#3b1d8a 0%,#6d28d9 42%,#7c3aed 70%,#4c1d95 100%)',
          padding: '0 32px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(109,40,217,0.35)'
        }}>
          {/* Decorative blobs */}
          {[
            { t:-30, l:-30, s:140 }, { t:20,  l:110, s:60  },
            { t:-10, r:60,  s:100 }, { b:30,  r:20,  s:70  },
            { b:10,  l:60,  s:44  }, { t:60,  r:160, s:28  },
          ].map((c, i) => (
            <div key={i} style={{
              position:'absolute', top:c.t, bottom:c.b, left:c.l, right:c.r,
              width:c.s, height:c.s, borderRadius:'50%',
              background:'rgba(255,255,255,0.07)'
            }} />
          ))}

          {/* Title */}
          <div style={{ textAlign:'center', paddingTop:24, position:'relative', zIndex:1 }}>
            <h1 style={{
              margin:'6px 0 10px', fontSize:20, fontWeight:900,
              letterSpacing:4, color:'#fff', textTransform:'uppercase',
              textShadow:'0 2px 12px rgba(0,0,0,0.25)'
            }}>Leader Board</h1>

            {/* Quiz name badge */}
            <div style={{
              display:'inline-flex', alignItems:'center', gap:8,
              background:'rgba(255,255,255,0.15)',
              backdropFilter:'blur(8px)',
              border:'1.5px solid rgba(255,255,255,0.30)',
              borderRadius:40,
              padding:'7px 20px',
              maxWidth:420,
            }}>
              <span style={{ fontSize:15 }}>📋</span>
              <span style={{
                fontSize:14, fontWeight:700, color:'#fff',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'
              }}>{quizTitle}</span>
            </div>
          </div>

          {/* Podium players */}
          {board.length === 0 ? (
            <div style={{ textAlign:'center', color:'rgba(255,255,255,0.65)', padding:'40px 0', fontSize:14 }}>
              No results yet for this quiz.
            </div>
          ) : (
            <div style={{
              display:'flex', alignItems:'flex-end', justifyContent:'center',
              gap:16, marginTop:20, position:'relative', zIndex:1
            }}>
              {podium.map(({ item, rank, barH, avSize, ring }, idx) => {
                if (!item) return <div key={idx} style={{ width:140 }} />;
                const isFirst = rank === 1;
                const isMe    = item.student?._id === user?._id;
                return (
                  <div key={item._id} style={{
                    display:'flex', flexDirection:'column', alignItems:'center', width:140
                  }}>
                    {isFirst
                      ? <div style={{ fontSize:28, lineHeight:1, marginBottom:4 }}>👑</div>
                      : <div style={{ height:36 }} />
                    }

                    <div style={{
                      width:avSize+8, height:avSize+8, borderRadius:'50%',
                      border:`3px solid ${ring}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow: isFirst ? '0 0 20px rgba(251,191,36,0.55)' : 'none'
                    }}>
                      <Avatar name={item.student?.name} size={avSize} fontSize={isFirst ? 24 : 18} />
                    </div>

                    <div style={{
                      fontSize:isFirst ? 36 : 26, fontWeight:900, lineHeight:1,
                      color:isFirst ? '#fbbf24' : '#e0d7ff', marginTop:8,
                      textShadow:isFirst ? '0 0 16px rgba(251,191,36,0.7)' : 'none'
                    }}>{rank}</div>

                    <div style={{
                      fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.90)',
                      textAlign:'center', marginTop:3,
                      maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'
                    }}>
                      {item.student?.name}
                      {isMe && <span style={{ color:'#fbbf24' }}> ★</span>}
                    </div>

                    <div style={{
                      marginTop:5, marginBottom:10,
                      background:'rgba(255,255,255,0.15)',
                      borderRadius:20, padding:'3px 12px',
                      fontSize:11, fontWeight:700,
                      color:isFirst ? '#fef3c7' : 'rgba(255,255,255,0.75)',
                    }}>
                      {item.score}/{item.totalMarks} &nbsp;·&nbsp; {item.percentage}%
                    </div>

                    {/* Podium bar */}
                    <div style={{
                      width:'100%', height:barH,
                      borderRadius:'12px 12px 0 0',
                      background:isFirst
                        ? 'linear-gradient(180deg,rgba(255,255,255,0.30) 0%,rgba(255,255,255,0.10) 100%)'
                        : 'linear-gradient(180deg,rgba(255,255,255,0.16) 0%,rgba(255,255,255,0.05) 100%)',
                      border:`1px solid ${isFirst ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.15)'}`,
                      borderBottom:'none',
                      display:'flex', alignItems:'center', justifyContent:'center'
                    }}>
                      <span style={{ fontSize:22, opacity:0.5 }}>
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ════ RANKED LIST ════ */}
        {board.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingInline:4 }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#374151' }}>All Participants</span>
              {totalP > 1 && (
                <span style={{ fontSize:12, color:'#9ca3af' }}>Page {listPage+1} of {totalP}</span>
              )}
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <ArrowBtn direction="left"  disabled={listPage === 0}        onClick={() => setListPage(p => p - 1)} />

              <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {listItems.map((item, i) => {
                  if (!item) return <div key={`pad-${i}`} />;
                  const rank = listPage * LIST_PAGE_SIZE + i + 1;
                  const isMe = item.student?._id === user?._id;
                  const pink = i % 2 === 0;
                  return (
                    <div key={item._id} style={{
                      display:'flex', alignItems:'center', gap:12,
                      background: pink ? '#fdf2f8' : '#f5f3ff',
                      borderRadius:16, padding:'14px 16px',
                      border: isMe
                        ? '2px solid #7c3aed'
                        : `2px solid ${pink ? '#fbcfe8' : '#ddd6fe'}`,
                      boxShadow:'0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                      {/* Rank pill */}
                      <div style={{
                        minWidth:40, height:32, borderRadius:10,
                        background: pink
                          ? 'linear-gradient(135deg,#ec4899,#db2777)'
                          : 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
                        color:'#fff', fontWeight:800, fontSize:13,
                        display:'flex', alignItems:'center', justifyContent:'center', gap:3,
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
                          {isMe && <span style={{ color:'#7c3aed', marginLeft:4 }}>★</span>}
                        </div>
                        <div style={{ fontSize:11, color:'#9ca3af', marginTop:1 }}>
                          ⏱ {Math.floor(item.timeTaken/60)}m {item.timeTaken%60}s
                        </div>
                      </div>

                      {/* Score badge */}
                      <div style={{
                        flexShrink:0, textAlign:'center',
                        background: pink ? '#fce7f3' : '#ede9fe',
                        borderRadius:12, padding:'6px 10px'
                      }}>
                        <div style={{
                          fontSize:15, fontWeight:900,
                          color: pink ? '#be185d' : '#5b21b6', lineHeight:1
                        }}>
                          {item.percentage}%
                        </div>
                        <div style={{ fontSize:9, color:'#9ca3af', fontWeight:600, marginTop:2 }}>
                          {item.score}/{item.totalMarks}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <ArrowBtn direction="right" disabled={listPage >= totalP-1} onClick={() => setListPage(p => p + 1)} />
            </div>
          </div>
        )}

        {/* Back button */}
        <div style={{ display:'flex', gap:12, marginTop:4 }}>
          <Link to="/student" style={{
            display:'inline-flex', alignItems:'center', gap:6,
            background:'#7c3aed', color:'#fff',
            padding:'10px 20px', borderRadius:10,
            textDecoration:'none', fontSize:13, fontWeight:700,
            boxShadow:'0 3px 10px rgba(124,58,237,0.30)'
          }}>← Back to Dashboard</Link>
          <Link to="/results" style={{
            display:'inline-flex', alignItems:'center', gap:6,
            background:'white', color:'#374151',
            padding:'10px 20px', borderRadius:10,
            textDecoration:'none', fontSize:13, fontWeight:600,
            border:'1.5px solid #e5e7eb'
          }}>My Results</Link>
        </div>

      </div>
    </StudentLayout>
  );
}
