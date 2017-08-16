docker_wrapper_map node 8.4.0

docker_wrapper_server_env_livereload(){
  docker_wrapper_env -p ${LABO_PORT_PREFIX}80:8000 -p 35729:35729
}
