
// import React, { useEffect, useState } from 'react';
// import { Box, Typography, CircularProgress } from '@mui/material';
// import { useSocket } from '../../hooks/useSocket';
// import { useAudio } from '../../hooks/useAudio';

// interface RFIDTag {
//   epc: string;
//   rssi: number;
//   timestamp: Date;
// }

// interface RFIDScannerProps {
//   onTagsDetected: (tags: RFIDTag[]) => void;
//   isScanning: boolean;
// }

// export const RFIDScanner: React.FC<RFIDScannerProps> = ({
//   onTagsDetected,
//   isScanning,
// }) => {
//   const [tags, setTags] = useState<RFIDTag[]>([]);
//   const socket = useSocket();
//   const { playSound } = useAudio();

//   useEffect(() => {
//     if (!socket) return;

//     // Listen for RFID tag detection events
//     socket.on('rfid:tagDetected', (tag: RFIDTag) => {
//       setTags((prev) => {
//         // Avoid duplicates
//         if (prev.some((t) => t.epc === tag.epc)) {
//           return prev;
//         }
//         playSound('beep');
//         return [...prev, tag];
//       });
//     });

//     socket.on('rfid:scanComplete', (detectedTags: RFIDTag[]) => {
//       setTags(detectedTags);
//       onTagsDetected(detectedTags);
//       playSound('success');
//     });

//     return () => {
//       socket.off('rfid:tagDetected');
//       socket.off('rfid:scanComplete');
//     };
//   }, [socket, onTagsDetected, playSound]);

//   useEffect(() => {
//     if (!isScanning) {
//       setTags([]);
//     }
//   }, [isScanning]);

//   return (
//     <Box
//       sx={{
//         position: 'relative',
//         width: '100%',
//         height: 400,
//         bgcolor: isScanning ? 'primary.light' : 'grey.100',
//         border: '4px solid',
//         borderColor: isScanning ? 'primary.main' : 'grey.300',
//         borderRadius: 4,
//         display: 'flex',
//         flexDirection: 'column',
//         alignItems: 'center',
//         justifyContent: 'center',
//         transition: 'all 0.3s ease',
//       }}
//     >
//       {isScanning ? (
//         <>
//           <CircularProgress size={80} thickness={4} />
//           <Typography variant="h4" sx={{ mt: 3, color: 'primary.main' }}>
//             Scanning for items...
//           </Typography>
//           <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
//             Place books flat on the reader pad below
//           </Typography>
          
//           {tags.length > 0 && (
//             <Box
//               sx={{
//                 position: 'absolute',
//                 top: 16,
//                 right: 16,
//                 bgcolor: 'success.main',
//                 color: 'white',
//                 borderRadius: '50%',
//                 width: 60,
//                 height: 60,
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//               }}
//             >
//               <Typography variant="h4" fontWeight="bold">
//                 {tags.length}
//               </Typography>
//             </Box>
//           )}
//         </>
//       ) : (
//         <>
//           <Box
//             component="img"
//             src="/assets/rfid-icon.svg"
//             sx={{ width: 120, height: 120, opacity: 0.3 }}
//           />
//           <Typography variant="h5" color="text.secondary" sx={{ mt: 2 }}>
//             Ready to scan
//           </Typography>
//         </>
//       )}
//     </Box>
//   );
// };

