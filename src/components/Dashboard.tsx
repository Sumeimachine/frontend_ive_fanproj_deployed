import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Grid,
  Image,
  Heading,
  Text,
  VStack,
  Button,
  Stack,
} from "@chakra-ui/react";
import ReactSelect from "react-select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import songsData from "../assets/songs.json";

interface SongMetrics {
  song: string;
  youtubeViews: number;
  youtubeLikes: number;
  youtubeId: string;
}

interface Song {
  name: string;
  youtubeId: string;
}

const Dashboard: React.FC = () => {
  const IVE_SONGS: Song[] = songsData;
  const [metrics, setMetrics] = useState<SongMetrics[]>([]);
  const [songA, setSongA] = useState<string>("");
  const [songB, setSongB] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchMetrics = async () => {
    const selectedSongs = [songA, songB].filter(Boolean);
    if (selectedSongs.length === 0) return;

    setLoading(true);
    setError("");

    try {
      const updatedMetrics: SongMetrics[] = await Promise.all(
        selectedSongs.map(async (songName) => {
          const song = IVE_SONGS.find((s) => s.name === songName)!;
          try {
            const res = await axios.get(
              `${import.meta.env.VITE_API_URL}/Youtube/trends?videoIds=${song.youtubeId}`
            );
            const data = (res.data as any)[0] || {};
            return {
              song: song.name,
              youtubeViews: data.Views ?? data.views ?? 0,
              youtubeLikes: data.Likes ?? data.likes ?? 0,
              youtubeId: song.youtubeId,
            };
          } catch {
            return {
              song: song.name,
              youtubeViews: 0,
              youtubeLikes: 0,
              youtubeId: song.youtubeId,
            };
          }
        })
      );

      setMetrics((prev) => {
        const otherMetrics = prev.filter((m) => !selectedSongs.includes(m.song));
        return [...otherMetrics, ...updatedMetrics];
      });
    } catch (err) {
      console.error(err);
      setError("Failed to fetch metrics.");
    } finally {
      setLoading(false);
    }
  };

  const getThumbnail = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

  // react-select options
  const songOptions = IVE_SONGS.map((s) => ({ value: s.name, label: s.name }));

  const songsToShow =
    songA || songB
      ? metrics.filter((m) => [songA, songB].includes(m.song))
      : IVE_SONGS.map((song) => ({
          song: song.name,
          youtubeViews: 0,
          youtubeLikes: 0,
          youtubeId: song.youtubeId,
        }));

  const comparisonData = songA && songB ? songsToShow.filter((m) => [songA, songB].includes(m.song)) : [];

  return (
    <Box
      bgGradient="radial(circle at top, #1A152A, #0A0812 80%)"
      color="white"
      minH="100vh"
      py={{ base: 10, md: 20 }}
      px={{ base: 4, md: 10 }}
    >
      <Box maxW="1200px" mx="auto" textAlign="center">
        <Heading
          as="h1"
          fontSize={{ base: "2xl", md: "4xl" }}
          fontWeight="700"
          mb={{ base: 10, md: 20 }}
          color="#E6E0F8"
        >
          IVE YouTube Metrics Dashboard
        </Heading>

        {error && <Text color="red.400" mb={4}>{error}</Text>}

        {/* Searchable Dropdowns */}
        <Stack direction={{ base: "column", md: "row" }} spacing={4} justify="center" mb={8}>
          <Box maxW="300px">
            <ReactSelect
              options={songOptions}
              value={songOptions.find((opt) => opt.value === songA)}
              onChange={(selected) => setSongA(selected?.value || "")}
              placeholder="Type/Select Song A"
              isClearable
              styles={{
                control: (base) => ({
                  ...base,
                  background: "#2C2440",
                  borderRadius: "12px",
                }),
                singleValue: (base) => ({ ...base, color: "#fff" }), // selected text
                input: (base) => ({ ...base, color: "#fff" }),       // typing/search text
                placeholder: (base) => ({ ...base, color: "#fff" }), // placeholder text
                menu: (base) => ({ ...base, background: "#2C2440" }),
                option: (base, state) => ({
                  ...base,
                  background: state.isFocused ? "#40365E" : "#2C2440",
                  color: "#fff",
                }),
              }}
            />
          </Box>

          <Box maxW="300px">
            <ReactSelect
              options={songOptions}
              value={songOptions.find((opt) => opt.value === songB)} // <-- uses songB state
              onChange={(selected) => setSongB(selected?.value || "")} // <-- updates songB state
              placeholder="Type/Select Song B"
              isClearable
              styles={{
                control: (base) => ({
                  ...base,
                  background: "#2C2440",
                  borderRadius: "12px",
                }),
                singleValue: (base) => ({ ...base, color: "#fff" }),
                input: (base) => ({ ...base, color: "#fff" }),
                placeholder: (base) => ({ ...base, color: "#fff" }),
                menu: (base) => ({ ...base, background: "#2C2440" }),
                option: (base, state) => ({
                  ...base,
                  background: state.isFocused ? "#40365E" : "#2C2440",
                  color: "#fff",
                }),
              }}
            />
          </Box>

          <Button
            onClick={fetchMetrics}
            isLoading={loading}
            loadingText="Loading..."
            bgGradient="linear(to-r, #A2D2FF, #FFAFCC)"
            color="#1A1625"
            fontWeight="600"
            borderRadius="12px"
          >
            Update Metrics
          </Button>
        </Stack>

        {/* Song Cards */}
        <Grid templateColumns={{ base: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }} gap={{ base: 6, md: 10 }} mb={12}>
          {songsToShow.map((song) => (
            <Box
              key={song.song}
              borderRadius="25px"
              overflow="hidden"
              bg="rgba(255,255,255,0.06)"
              boxShadow="0 8px 25px rgba(0,0,0,0.3)"
              backdropFilter="blur(8px)"
              transition="all 0.3s"
              _hover={{ transform: "scale(1.05)", boxShadow: "0 12px 40px rgba(0,0,0,0.6)" }}
            >
              <Image src={getThumbnail(song.youtubeId)} alt={song.song} w="100%" h="200px" objectFit="cover" />
              <VStack py={4}>
                <Heading fontSize="lg" color="#E6E0F8">{song.song}</Heading>
                <Text fontSize="md" color="#CDB4DB">
                  {song.youtubeViews.toLocaleString()} views • {song.youtubeLikes.toLocaleString()} likes
                </Text>
                <Button
                  as="a"
                  href={`https://www.youtube.com/watch?v=${song.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  bgGradient="linear(to-r, #A2D2FF, #FFAFCC)"
                  color="#1A1625"
                  fontWeight="600"
                  borderRadius="12px"
                  mt={2}
                >
                  ▶ Watch on YouTube
                </Button>
              </VStack>
            </Box>
          ))}
        </Grid>

        {/* Comparison Chart */}
        {comparisonData.length === 2 && (
          <Box bg="rgba(255,255,255,0.08)" borderRadius="20px" p={6} backdropFilter="blur(8px)">
            <Heading fontSize="xl" mb={6} color="#E6E0F8">Compare Two Songs</Heading>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="song" tick={{ fill: "#E6E0F8" }} />
                <YAxis tick={{ fill: "#E6E0F8" }} />
                <Tooltip formatter={(value: any) => value.toLocaleString()} contentStyle={{ backgroundColor: "rgba(40,40,60,0.9)", borderRadius: 10, border: "none", color: "#fff" }} />
                <Legend verticalAlign="top" wrapperStyle={{ color: "#E6E0F8" }} />
                <Bar dataKey="youtubeViews" fill="#B8C0FF" name="Views" radius={[10, 10, 0, 0]} />
                <Bar dataKey="youtubeLikes" fill="#FFAFCC" name="Likes" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
// import React, { useState } from "react";
// import axios from "axios";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";
// import songsData from "../assets/songs.json";

// interface SongMetrics {
//   song: string;
//   youtubeViews: number;
//   youtubeLikes: number;
//   youtubeId: string;
// }

// interface Song {
//   name: string;
//   youtubeId: string;
// }

// const Dashboard: React.FC = () => {
//   const IVE_SONGS: Song[] = songsData;
//   const [metrics, setMetrics] = useState<SongMetrics[]>([]);
//   const [songA, setSongA] = useState<string>("");
//   const [songB, setSongB] = useState<string>("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const fetchMetrics = async () => {
//     const selectedSongs = [songA, songB].filter(Boolean);
//     if (selectedSongs.length === 0) return;

//     setLoading(true);
//     setError("");

//     try {
//       const updatedMetrics: SongMetrics[] = await Promise.all(
//         selectedSongs.map(async (songName) => {
//           const song = IVE_SONGS.find((s) => s.name === songName)!;
//           try {
//             const res = await axios.get(
//               `${import.meta.env.VITE_API_URL}/Youtube/trends?videoIds=${song.youtubeId}`
//             );
//             const data = (res.data as any)[0] || {};
//             return {
//               song: song.name,
//               youtubeViews: data.Views ?? data.views ?? 0,
//               youtubeLikes: data.Likes ?? data.likes ?? 0,
//               youtubeId: song.youtubeId,
//             };
//           } catch {
//             return {
//               song: song.name,
//               youtubeViews: 0,
//               youtubeLikes: 0,
//               youtubeId: song.youtubeId,
//             };
//           }
//         })
//       );

//       // Merge with existing metrics
//       setMetrics((prev) => {
//         const otherMetrics = prev.filter((m) => !selectedSongs.includes(m.song));
//         return [...otherMetrics, ...updatedMetrics];
//       });
//     } catch (err) {
//       console.error(err);
//       setError("Failed to fetch metrics.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getThumbnail = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

//   // Always display all songs
// const songsToShow =
//   songA || songB
//     ? metrics.filter((m) => [songA, songB].includes(m.song))
//     : IVE_SONGS.map((song) => ({
//         song: song.name,
//         youtubeViews: 0,
//         youtubeLikes: 0,
//         youtubeId: song.youtubeId,
//       }));


//   // Comparison chart only if exactly two songs selected
//   const comparisonData =
//     songA && songB
//       ? songsToShow.filter((m) => [songA, songB].includes(m.song))
//       : [];

//   return (
//     <div
//       style={{
//         background: "radial-gradient(circle at top, #1A152A, #0A0812 80%)",
//         color: "#fff",
//         fontFamily: "'Poppins', sans-serif",
//         minHeight: "100vh",
//         width: "100vw",
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "flex-start",
//         overflowY: "auto",
//         padding: "40px 20px",
//         boxSizing: "border-box",
//       }}
//     >
//       <div style={{ maxWidth: "1200px", width: "100%", textAlign: "center" }}>
//         <h1 style={{ fontSize: "2.8rem", fontWeight: 700, color: "#E6E0F8", marginBottom: "40px" }}>
//           IVE YouTube Metrics Dashboard
//         </h1>

//         {/* Manual Refresh Button */}
//         <button
//           onClick={fetchMetrics}
//           disabled={loading || (!songA && !songB)}
//           style={{
//             marginBottom: "30px",
//             padding: "12px 25px",
//             borderRadius: "12px",
//             border: "none",
//             background: "linear-gradient(90deg, #A2D2FF, #FFAFCC)",
//             color: "#1A1625",
//             fontWeight: 600,
//             cursor: "pointer",
//           }}
//         >
//           {loading ? "Loading..." : "Update Metrics"}
//         </button>
//         {error && <p style={{ color: "red", marginBottom: "20px" }}>{error}</p>}

//         {/* Select Dropdowns */}
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "center",
//             flexWrap: "wrap",
//             gap: "20px",
//             marginBottom: "50px",
//           }}
//         >
//           {[{ label: "Select Song A", value: songA, setter: setSongA },
//             { label: "Select Song B", value: songB, setter: setSongB }].map((sel, i) => (
//             <select
//               key={i}
//               value={sel.value}
//               onChange={(e) => sel.setter(e.target.value)}
//               style={{
//                 padding: "12px 18px",
//                 borderRadius: "12px",
//                 border: "1px solid #40365E",
//                 background: "#2C2440",
//                 color: "#fff",
//                 fontSize: "1rem",
//                 outline: "none",
//                 cursor: "pointer",
//               }}
//             >
//               <option value="">{sel.label}</option>
//               {IVE_SONGS.map((s) => (
//                 <option key={s.name} value={s.name}>{s.name}</option>
//               ))}
//             </select>
//           ))}
//         </div>

//         {/* Song Cards */}
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
//             gap: "40px",
//             width: "100%",
//             marginBottom: "60px",
//           }}
//         >
//           {songsToShow.map((song) => (
//             <div
//               key={song.song}
//               style={{
//                 background: "rgba(255,255,255,0.06)",
//                 borderRadius: "20px",
//                 padding: "20px",
//                 textAlign: "center",
//                 boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
//                 backdropFilter: "blur(8px)",
//                 transition: "transform 0.3s ease, box-shadow 0.3s ease",
//               }}
//             >
//               <img
//                 src={getThumbnail(song.youtubeId)}
//                 alt={song.song}
//                 style={{ width: "100%", borderRadius: "15px", marginBottom: "15px", height: "auto", objectFit: "cover" }}
//               />
//               <h3 style={{ color: "#E6E0F8", fontSize: "1.3rem", marginBottom: "10px" }}>{song.song}</h3>
//               <p style={{ fontSize: "1rem", color: "#CDB4DB", marginBottom: "12px" }}>
//                 {song.youtubeViews.toLocaleString()} views • {song.youtubeLikes.toLocaleString()} likes
//               </p>
//               <a
//                 href={`https://www.youtube.com/watch?v=${song.youtubeId}`}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 style={{
//                   display: "inline-block",
//                   marginTop: "10px",
//                   padding: "10px 20px",
//                   background: "linear-gradient(90deg, #A2D2FF, #FFAFCC)",
//                   color: "#1A1625",
//                   borderRadius: "12px",
//                   fontWeight: 600,
//                   textDecoration: "none",
//                 }}
//               >
//                 ▶ Watch on YouTube
//               </a>
//             </div>
//           ))}
//         </div>

//         {/* Comparison Chart */}
//         {comparisonData.length === 2 && (
//           <div
//             style={{
//               background: "rgba(255,255,255,0.08)",
//               borderRadius: "20px",
//               padding: "30px",
//               width: "100%",
//               backdropFilter: "blur(8px)",
//             }}
//           >
//             <h2 style={{ textAlign: "center", color: "#E6E0F8", marginBottom: "25px", fontSize: "1.6rem" }}>
//               Compare Two Songs
//             </h2>
//             <ResponsiveContainer width="100%" height={350}>
//               <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
//                 <XAxis dataKey="song" tick={{ fill: "#E6E0F8" }} />
//                 <YAxis tick={{ fill: "#E6E0F8" }} />
//                 <Tooltip
//                   formatter={(value: any) => value.toLocaleString()}
//                   contentStyle={{ backgroundColor: "rgba(40,40,60,0.9)", borderRadius: 10, border: "none", color: "#fff" }}
//                 />
//                 <Legend verticalAlign="top" wrapperStyle={{ color: "#E6E0F8" }} />
//                 <Bar dataKey="youtubeViews" fill="#B8C0FF" name="Views" radius={[10, 10, 0, 0]} />
//                 <Bar dataKey="youtubeLikes" fill="#FFAFCC" name="Likes" radius={[10, 10, 0, 0]} />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Dashboard;
