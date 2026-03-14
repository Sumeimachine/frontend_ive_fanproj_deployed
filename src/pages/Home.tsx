import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Grid, Image, Heading, Text, VStack } from "@chakra-ui/react";
import membersDataRaw from "../assets/members.json";

// ✅ Define the member type
interface Member {
  id: string;
  name: string;
  photoUrl: string;
}

// ✅ Cast the JSON import to the typed array
const membersData: Member[] = membersDataRaw as Member[];

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      minH="100vh"
      w="100%"
      bgGradient="radial(circle at top, #1A152A, #0A0812 80%)"
      color="white"
      py={{ base: 10, md: 20 }}
      px={{ base: 4, md: 10 }}
    >
      <Heading
        as="h1"
        fontSize={{ base: "2xl", md: "4xl" }}
        fontWeight="700"
        mb={{ base: 10, md: 20 }}
        textAlign="center"
      >
        IVE Members
      </Heading>

      <Grid
        templateColumns={{
          base: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
        }}
        gap={{ base: 6, md: 10 }}
        maxW="1200px"
        mx="auto"
      >
        {membersData.map((member) => (
          <Box
            key={member.id}
            as="button"
            onClick={() => navigate(`/member/${member.id}`)} // navigate to member info page
            borderRadius="20px"
            overflow="hidden"
            bg="rgba(255,255,255,0.05)"
            boxShadow="0 6px 20px rgba(0,0,0,0.3)"
            transition="all 0.3s"
            _hover={{
              transform: "scale(1.05)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
          >
            <Image
              src={member.photoUrl}
              alt={member.name || ""}
              w="100%"
              h="auto"
              objectFit="cover"
            />
            <VStack py={4}>
              <Text fontSize={{ base: "md", md: "lg" }} fontWeight="semibold">
                {member.name}
              </Text>
            </VStack>
          </Box>
        ))}
      </Grid>
    </Box>
  );
};

export default Home;
// import React from "react";
// import { useNavigate } from "react-router-dom";
// import { Box, Grid, Image, Heading, Text, VStack } from "@chakra-ui/react";
// import membersDataRaw from "../assets/members.json";

// // ✅ Define the member type
// interface Member {
//   id: string;
//   name: string;
//   photoUrl: string;
// }

// // ✅ Cast the JSON import to the typed array
// const membersData: Member[] = membersDataRaw as Member[];

// const Home: React.FC = () => {
//   const navigate = useNavigate();

//   return (
//     <Box
//       minH="100vh"
//       w="100%"
//       bgGradient="radial(circle at top, #1A152A, #0A0812 80%)"
//       color="white"
//       py={{ base: 10, md: 20 }}
//       px={{ base: 4, md: 10 }}
//     >
//       <Heading
//         as="h1"
//         fontSize={{ base: "2xl", md: "4xl" }}
//         fontWeight="700"
//         mb={{ base: 10, md: 20 }}
//         textAlign="center"
//       >
//         IVE Members
//       </Heading>

//       <Grid
//         templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }}
//         gap={{ base: 6, md: 10 }}
//         maxW="1200px"
//         mx="auto"
//       >
//         {membersData.map((member) => (
//           <Box
//             key={member.id}
//             as="button"
//             onClick={() => navigate(`/dashboard/${member.id}`)}
//             borderRadius="20px"
//             overflow="hidden"
//             bg="rgba(255,255,255,0.05)"
//             boxShadow="0 6px 20px rgba(0,0,0,0.3)"
//             transition="all 0.3s"
//             _hover={{
//               transform: "scale(1.05)",
//               boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
//             }}
//           >
//             <Image
//               src={member.photoUrl}
//               alt={member.name || ""}
//               w="100%"
//               h="auto"
//               objectFit="cover"
//             />
//             <VStack py={4}>
//               <Text fontSize={{ base: "md", md: "lg" }} fontWeight="semibold">
//                 {member.name}
//               </Text>
//             </VStack>
//           </Box>
//         ))}
//       </Grid>
//     </Box>
//   );
// };

// export default Home;
// import React from "react";
// import { useNavigate } from "react-router-dom";
// import membersDataRaw from "../assets/members.json";

// // ✅ Define the member type
// interface Member {
//   id: string;
//   name: string;
//   photoUrl: string;
// }

// // ✅ Cast the JSON import to the typed array
// const membersData: Member[] = membersDataRaw as Member[];

// const Home: React.FC = () => {
//   const navigate = useNavigate();

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         width: "100vw",
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         padding: "40px 20px",
//         background: "radial-gradient(circle at top, #1A152A, #0A0812 80%)",
//         color: "#fff",
//         boxSizing: "border-box",
//       }}
//     >
//       <h1 style={{ fontSize: "3rem", fontWeight: 700, marginBottom: "50px" }}>IVE Members</h1>

//       <div
//         style={{
//           display: "grid",
//         //   gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
//           gridTemplateColumns: "repeat(3, 1fr)",
//           gap: "30px",
//           width: "100%",
//           maxWidth: "1200px",
//         }}
//       >
//         {membersData.map((member) => (
//           <div
//             key={member.id}
//             onClick={() => navigate(`/dashboard/${member.id}`)}
//             style={{
//               background: "rgba(255,255,255,0.05)",
//               borderRadius: "20px",
//               padding: "20px",
//               textAlign: "center",
//               cursor: "pointer",
//               transition: "transform 0.3s ease, box-shadow 0.3s ease",
//               boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
//             }}
//             onMouseEnter={(e) => {
//               e.currentTarget.style.transform = "scale(1.05)";
//               e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)";
//             }}
//             onMouseLeave={(e) => {
//               e.currentTarget.style.transform = "scale(1)";
//               e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.3)";
//             }}
//           >
//             <img
//               src={member.photoUrl}
//               alt={member.name || ""} // ✅ ensure alt is string
//               style={{
//                 width: "100%",
//                 height: "auto",
//                 borderRadius: "15px",
//                 marginBottom: "15px",
//                 objectFit: "cover",
//               }}
//             />
//             <h3 style={{ fontSize: "1.3rem", marginBottom: "10px" }}>{member.name}</h3>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Home;
