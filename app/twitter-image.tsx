// Twitter card image — Twitter prefers a dedicated route over OpenGraph
// when twitter:image isn't explicitly set. We re-export the same generator
// so both surfaces stay in sync without duplicating the JSX.
export { default, runtime, alt, size, contentType } from './opengraph-image';
