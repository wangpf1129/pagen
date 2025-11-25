import { type LanguageModel, streamText } from "ai";
import { llm_service } from "../services/llm";

const sys_prompt = `# System Instruction for Character-Based Web Design

Create HTML webpages that align with provided character information and specified titles.

## Design Style

- Avoid blue, indigo, or purple colors
- Choose color palettes according to character identity
- Adopt calm yet vibrant manga/cartoon aesthetic
- No gradient or shadow
- Maintain clean, simple design without compromising detail richness
- **No hover transitions or animations**

## Content Approach

- Integrate character details seamlessly into webpage narrative
- Mirror popular social media formats (WeChat articles, Xiaohongshu posts, etc.)
- Ensure high readability and visual engagement
- Include comprehensive information while maintaining aesthetic appeal

## Technical Requirements

- **Use Tailwind CSS for all styling** (include CDN link)
- **Output plain HTML only** - no separate CSS files
- Ensure responsive design with Tailwind's responsive utilities
- Focus on clean, semantic HTML structure
- **Use Lucide icons instead of emojis** (include Lucide CDN)
  - example \`<i data-lucide="award" class="w-8 h-8 mr-3 text-custom-secondary-yellow"></i>\`
  - use \`window.lucide?.createIcons()\` to initialize lucide
- Implement proper Tailwind color classes for your chosen palette
- It should be a singple page with no real external link or download button

## Visual Elements

- **Icons**: Prefer Lucide icons over emojis for better consistency
- **Interactivity**: Static design - no hover effects or transitions
- **Layout**: Utilize Tailwind's flexbox and grid utilities for responsive layouts

## Image Integration
- **Use AI-generated images with the format: https://anyimage.bullet-on-bible.workers.dev/{image-name}.jpg
- **Place relevant keywords in the alt attribute (keep it concise, 2-4 keywords)
- **Include character portraits, scene illustrations, and relevant visual elements
- **Use descriptive, keyword-rich filenames that will help the service find appropriate images
- **The service automatically searches Pixabay for relevant images based on the filename
- **Example: <img src="https://anyimage.bullet-on-bible.workers.dev/medieval-knight.jpg" alt="knight warrior armor">
- **Use at most 3 images
- **Avoid special characters and spaces - use hyphens instead
- **Keep filenames concise but meaningful
- **The service will automatically find relevant images from Pixabay based on these keywords



## Expected Output Format

Just output the final html and wrap it in code block

\`\`\`html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>[Character-appropriate title]</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
  </head>
  <body>
    <!-- Complete webpage content with Tailwind classes -->
    <!-- Must contain at least 300 words across all text content -->
    <!-- Include images using https://generate-image.com/{image-name} format -->
  </body>
</html>
\`\`\`

Generate the webpage in Chinese`;

export function generateWebpage({
  prompt,
  model = "deepseek-v3",
}: {
  prompt: string;
  model?: string;
}) {
  return streamText({
    model: llm_service.createModel(model),
    system: sys_prompt,
    prompt,
    temperature: 0.4,
  });
}
