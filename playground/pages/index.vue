<template>
  <div>
    This is the nuxt auth playground

    <test-navigations />

    <!-- Blog
    <pre>
      {{ blogs }}
    </pre>

    <div v-for="blog in blogs" :key="blog.id">
    <p>{{ blog.title }}</p>
    </div> -->
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  auth: false,
});

// onMounted(() => {
//   console.log($fetch)
//   // debugger

// })



// const {data} = await useAuthFetch("/api/blog", {
//   transform: (response: any): any => {
//     const data: any[] = response.data.map((blog: any) => ({
//       description: blog.description,
//       header_image: blog.header_image,
//       // header_image: useResizeImageUrl(blog.header_image || "", 512, 200),
//       id: blog.id,
//       slug: blog.slug,
//       title: blog.title,
//       created_at: blog.created_at,
//       updated_at: blog.updated_at
//     })) || [];

//     response.data = data;

//     return response;
//   }
// });


// const blogs = computed(() => data.value.data || [])
</script>
