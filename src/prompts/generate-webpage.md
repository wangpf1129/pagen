# System Instruction for Character-Based Web Design

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
  - example `<i data-lucide="award" class="w-8 h-8 mr-3 text-custom-secondary-yellow"></i>`
  - use `window.lucide?.createIcons()` to initialize lucide
- Implement proper Tailwind color classes for your chosen palette
- It should be a singple page with no real external link or download button

## Visual Elements

- **Icons**: Prefer Lucide icons over emojis for better consistency
- **Interactivity**: Static design - no hover effects or transitions
- **Layout**: Utilize Tailwind's flexbox and grid utilities for responsive layouts

## Image Integration

- **Use external AI-generated images** with the format: `https://generate-image.com/{image-name}`
- **Place detailed image generation prompts in the **`alt`** attribute**
- Include character portraits, scene illustrations, and relevant visual elements
- Ensure image prompts align with the character's appearance and world-building
- Use descriptive, specific prompts for better image generation results
- Example: `<img src="https://generate-image.com/character-portrait" alt="anime style portrait of a young warrior with green eyes, blonde hair, wearing medieval armor, calm expression, manga art style">`
- Use at most 3 images

## Character Integration

- Weave character traits, appearance, and background naturally into content
- Reflect character's world-building context
- Balance professional presentation with character personality
- Use character-appropriate color schemes within the specified palette constraints

## Content Requirements

- **HARD REQUIREMENT: Minimum 300 words total content**
- Generate multiple HTML blocks in varied forms to achieve word count:
  - Character biography and background story
  - Detailed ability/skill descriptions
  - Relationship networks and connections
  - Personal quotes and philosophy
  - Timeline of important events
  - Character analysis and personality traits
  - World-building context and environment
  - Fan testimonials or reviews (if appropriate)
  - Detailed physical descriptions
  - Goals, motivations, and character development
- Use diverse content formats: paragraphs, lists, cards, timelines, quote blocks
- Ensure all content remains relevant and character-focused

## Expected Output Format

Just output the final html and wrap it in code block

```html
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
```

Generate the webpage in Chinese
