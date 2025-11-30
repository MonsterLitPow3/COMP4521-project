// import { cn } from '@/lib/utils';
// import { Platform, TextInput, type TextInputProps, StyleSheet } from 'react-native';

// function SearchInput({
//   className,
//   style,
//   placeholderClassName,
//   ...props
// }: TextInputProps & React.RefAttributes<TextInput>) {
//   return (
//     <TextInput
//       style={[
//         styles.searchInput,
//         props.editable === false &&
//           cn(
//             'opacity-50',
//             Platform.select({ web: 'disabled:pointer-events-none disabled:cursor-not-allowed' })
//           ),
//         Platform.select({
//           web: cn(
//             'outline-none transition-[color,box-shadow] selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground md:text-sm',
//             'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
//             'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
//           ),
//           native: 'placeholder:text-muted-foreground/50, ml-2',
//         }),
//         className,
//       ]}
//       {...props}
//     />
//   );
// }
// const styles = StyleSheet.create({
//   searchInput: {
//     flex: 1,
//     height: 8, // Increased for more vertical space
//     width: 280, // Wider for readability if needed
//     borderColor: '#d7d4d4ff',
//     borderWidth: 1,
//     borderRadius: 24, // More rounded for aesthetics
//     backgroundColor: '#fff',
//     color: 'black', // Return to black so it's visible
//     paddingLeft: 16, // Extra left padding for comfort
//     paddingRight: 16,
//     paddingVertical: 14, // This centers the text for fontSize: 20
//     fontSize: 20, // Large, readable text
//     // Remove lineHeight or set to match fontSize if needed
//     // textAlignVertical is fine but mostly relevant for Android
//     textAlignVertical: 'center',
//   },
// });

// export { SearchInput };

import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';

function SearchInput(props: TextInputProps) {
  return (
    <TextInput
      style={[
        styles.searchInput,
        props.editable === false && styles.disabled,
        props.style, // allows for further overrides from parent
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  searchInput: {
    height: 48,
    width: 280,
    borderColor: '#d7d4d4ff',
    borderWidth: 1,
    borderRadius: 24,
    backgroundColor: '#fff',
    color: 'black',
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 12,
    fontSize: 20,
    textAlignVertical: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});

export { SearchInput };
